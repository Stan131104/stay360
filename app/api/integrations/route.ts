import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import type { IntegrationInsert, IntegrationProvider } from '@/lib/types/database'

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()

    // Verify permission
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, provider, config } = body

    if (!name || !provider) {
      return NextResponse.json(
        { error: 'name and provider are required' },
        { status: 400 }
      )
    }

    // Validate provider
    const validProviders: IntegrationProvider[] = [
      'airbnb_ical',
      'vrbo_ical',
      'booking_ical',
      'generic_ical',
      'channel_manager_guesty',
      'channel_manager_hostaway',
      'channel_manager_mock',
    ]

    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: integration, error } = await supabase
      .from('integrations')
      .insert({
        tenant_id: tenant.id,
        name,
        provider,
        status: 'pending',
        config: config || {},
      } satisfies IntegrationInsert)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: integration.id })
  } catch (error) {
    console.error('Create integration error:', error)

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

export async function GET() {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()

    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(integrations)
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
