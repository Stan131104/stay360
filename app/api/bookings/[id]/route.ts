import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { id } = await params
    const supabase = await createClient()

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(id, name)
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Transform property relation
    const transformedBooking = {
      ...booking,
      property: Array.isArray(booking.property) ? booking.property[0] || null : booking.property
    }

    return NextResponse.json(transformedBooking)
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

export async function PUT(
  request: NextRequest,
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
    const body = await request.json()

    // First verify the booking belongs to this tenant
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        guest_name: body.guest_name,
        guest_email: body.guest_email,
        guest_phone: body.guest_phone,
        num_guests: body.num_guests,
        status: body.status,
        special_requests: body.special_requests,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .select(`
        *,
        property:properties(id, name)
      `)
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Transform property relation
    const transformedBooking = {
      ...updatedBooking,
      property: Array.isArray(updatedBooking.property) ? updatedBooking.property[0] || null : updatedBooking.property
    }

    return NextResponse.json(transformedBooking)
  } catch (error) {
    console.error('Update booking error:', error)

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

    // First verify the booking belongs to this tenant
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('bookings')
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
    console.error('Delete booking error:', error)

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
