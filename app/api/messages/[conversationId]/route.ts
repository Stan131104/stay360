import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { conversationId } = await params
    const supabase = await createClient()

    // Get conversation with relations
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        property:properties(id, name, thumbnail_url, address, city),
        booking:bookings(id, check_in, check_out, confirmation_code, status, total_price, currency, num_guests),
        guest_profile:guest_profiles(id, name, email, phone, avatar_url, total_bookings, average_rating, notes)
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

    // Get all messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('tenant_id', tenant.id)
      .order('sent_at', { ascending: true })

    if (msgError) {
      return NextResponse.json(
        { error: msgError.message },
        { status: 500 }
      )
    }

    // Mark unread inbound messages as read (if user has permission)
    if (['OWNER', 'MANAGER'].includes(tenant.role)) {
      const unreadMessageIds = messages
        ?.filter(m => m.direction === 'inbound' && !m.read_at)
        .map(m => m.id) || []

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessageIds)

        // Update conversation unread count
        await supabase
          .from('conversations')
          .update({ unread_count: 0 })
          .eq('id', conversationId)
      }
    }

    // Transform relations
    const transformedConversation = {
      ...conversation,
      property: Array.isArray(conversation.property) ? conversation.property[0] || null : conversation.property,
      booking: Array.isArray(conversation.booking) ? conversation.booking[0] || null : conversation.booking,
      guest_profile: Array.isArray(conversation.guest_profile) ? conversation.guest_profile[0] || null : conversation.guest_profile,
      messages: messages || [],
    }

    return NextResponse.json(transformedConversation)
  } catch (error) {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { conversationId } = await params

    // Verify permission
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    // Update conversation (e.g., status, archived)
    const { data: updated, error } = await supabase
      .from('conversations')
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('tenant_id', tenant.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
