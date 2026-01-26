import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { CalendarView } from '@/components/calendar/calendar-view'

export default async function CalendarPage() {
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  // Get current month's bookings
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const { data: bookings } = await supabase
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
    .gte('check_out', startOfMonth.toISOString().split('T')[0])
    .lte('check_in', endOfMonth.toISOString().split('T')[0])
    .order('check_in', { ascending: true })

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('tenant_id', tenant.id)
    .order('name', { ascending: true })

  // Transform the bookings to handle the property relation
  const transformedBookings = bookings?.map(booking => ({
    ...booking,
    property: Array.isArray(booking.property) ? booking.property[0] || null : booking.property
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View bookings across all properties
        </p>
      </div>

      <CalendarView
        initialBookings={transformedBookings}
        properties={properties || []}
        initialYear={today.getFullYear()}
        initialMonth={today.getMonth()}
      />
    </div>
  )
}
