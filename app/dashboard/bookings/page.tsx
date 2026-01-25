import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    blocked: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[status] || colors.pending}`}>
      {status}
    </span>
  )
}

export default async function BookingsPage() {
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      property:properties(id, name)
    `)
    .eq('tenant_id', tenant.id)
    .order('check_in', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          View and manage your reservations
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading bookings: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {!bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
            <p className="text-sm text-muted-foreground">
              Bookings will appear here after syncing with your integrations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Property
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Guest
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Check-in
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Check-out
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking: {
                id: string
                check_in: string
                check_out: string
                guest_name: string | null
                guest_email: string | null
                num_guests: number | null
                status: string
                total_price: number | null
                currency: string
                property: { id: string; name: string } | null
              }) => (
                <tr key={booking.id} className="border-b">
                  <td className="p-4 align-middle">
                    <div>
                      <p className="font-medium">{booking.property?.name || 'Unknown'}</p>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div>
                      <p className="font-medium">{booking.guest_name || '-'}</p>
                      {booking.guest_email && (
                        <p className="text-xs text-muted-foreground">{booking.guest_email}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle text-sm">
                    {booking.check_in}
                  </td>
                  <td className="p-4 align-middle text-sm">
                    {booking.check_out}
                  </td>
                  <td className="p-4 align-middle">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="p-4 align-middle text-right text-sm">
                    {booking.total_price
                      ? `${booking.currency} ${booking.total_price.toFixed(2)}`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
