import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

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

  // Generate calendar days
  const daysInMonth = endOfMonth.getDate()
  const firstDayOfWeek = startOfMonth.getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Map bookings to dates
  const bookingsByDate = new Map<string, typeof bookings>()
  bookings?.forEach(booking => {
    const checkIn = new Date(booking.check_in)
    const checkOut = new Date(booking.check_out)

    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!bookingsByDate.has(dateStr)) {
        bookingsByDate.set(dateStr, [])
      }
      bookingsByDate.get(dateStr)!.push(booking)
    }
  })

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View bookings across all properties
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{monthNames[today.getMonth()]} {today.getFullYear()}</CardTitle>
          <CardDescription>
            {bookings?.length || 0} bookings this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!properties || properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No properties to display. Connect an integration to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Calendar header */}
              <div className="grid grid-cols-7 gap-px bg-muted text-center text-xs font-medium mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2 bg-background">{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-muted">
                {/* Empty cells for days before the 1st */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-24 bg-background" />
                ))}

                {/* Days of the month */}
                {days.map(day => {
                  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayBookings = bookingsByDate.get(dateStr) || []
                  const isToday = day === today.getDate()

                  return (
                    <div
                      key={day}
                      className={`min-h-24 p-1 bg-background ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                    >
                      <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : booking.status === 'blocked'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                            title={`${(booking.property as unknown as { name: string } | null)?.name || 'Unknown'}: ${booking.guest_name || 'Blocked'}`}
                          >
                            {((booking.property as unknown as { name: string } | null)?.name || 'Unknown').slice(0, 10)}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
