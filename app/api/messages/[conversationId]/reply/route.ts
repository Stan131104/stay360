import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { getProviderAdapter } from '@/lib/integrations/providers'
import type { Integration } from '@/lib/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { conversationId } = await params

    // Verify permission - only OWNER and MANAGER can reply
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Get conversation with integration details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        integration:integrations(*)
      `)
      .eq('id', conversationId)
      .eq('tenant_id', tenant.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const integration = Array.isArray(conversation.integration)
      ? conversation.integration[0]
      : conversation.integration

    const now = new Date().toISOString()
    let deliveredToProvider = false
    let deliveryError: string | null = null

    // Try to send message to provider if integration exists
    if (integration && conversation.external_id) {
      try {
        const adapter = getProviderAdapter(integration as Integration)
        await adapter.initialize(integration as Integration)

        if (adapter.sendMessage) {
          const result = await adapter.sendMessage({
            conversation_external_id: conversation.external_id,
            content: body.content,
          })

          deliveredToProvider = result.success
          if (!result.success) {
            deliveryError = result.error || 'Failed to deliver message'
          }
        }
      } catch (error) {
        deliveryError = error instanceof Error ? error.message : 'Provider error'
      }
    }

    // Create message in database
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        tenant_id: tenant.id,
        conversation_id: conversationId,
        source_provider: conversation.source_provider,
        direction: 'outbound',
        sender_name: 'Host',
        sender_type: 'host',
        content: body.content.trim(),
        sent_at: now,
        delivered_to_provider: deliveredToProvider,
        delivery_error: deliveryError,
        metadata: {},
      })
      .select()
      .single()

    if (msgError) {
      return NextResponse.json(
        { error: msgError.message },
        { status: 500 }
      )
    }

    // Update conversation with last message info
    await supabase
      .from('conversations')
      .update({
        last_message_at: now,
        last_message_preview: body.content.trim().substring(0, 100),
        updated_at: now,
      })
      .eq('id', conversationId)

    return NextResponse.json({
      message,
      delivered_to_provider: deliveredToProvider,
      delivery_error: deliveryError,
    })
  } catch (error) {
    console.error('Reply error:', error)

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'No tenant selected') {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
