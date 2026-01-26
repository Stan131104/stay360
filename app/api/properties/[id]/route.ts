import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { id } = await params

    // Verify permission
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // First verify the property belongs to this tenant
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (fetchError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Delete associated bookings first
    await supabase
      .from('bookings')
      .delete()
      .eq('property_id', id)
      .eq('tenant_id', tenant.id)

    // Delete associated daily rates
    await supabase
      .from('daily_rates')
      .delete()
      .eq('property_id', id)
      .eq('tenant_id', tenant.id)

    // Delete the property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete property error:', error)

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { id } = await params
    const supabase = await createClient()

    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        integration:integrations(name, provider),
        bookings:bookings(count)
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (error || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(property)
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
