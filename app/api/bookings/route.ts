import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    let query = supabase
      .from('bookings')
      .select(`
        id,
        check_in,
        check_out,
        guest_name,
        status,
        property:properties(id, name)
      `)
      .eq('tenant_id', tenant.id)
      .order('check_in', { ascending: true })

    if (start) {
      query = query.gte('check_out', start)
    }

    if (end) {
      query = query.lte('check_in', end)
    }

    const { data: bookings, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform the property relation from array to object
    const transformedBookings = bookings?.map(booking => ({
      ...booking,
      property: Array.isArray(booking.property) ? booking.property[0] || null : booking.property
    }))

    return NextResponse.json(transformedBookings || [])
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
