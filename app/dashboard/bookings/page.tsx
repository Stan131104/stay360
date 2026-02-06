import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'
import { BookingFilters } from '@/components/bookings/booking-filters'
import { BookingDetailDialog } from '@/components/bookings/booking-detail-dialog'
import { Pagination } from '@/components/ui/pagination'

interface SearchParams {
  search?: string
  status?: string
  property?: string
  dateRange?: string
  sort?: string
  page?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

const ITEMS_PER_PAGE = 25

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    confirmed: 'default',
    pending: 'outline',
    cancelled: 'destructive',
    blocked: 'secondary',
  }

  return (
    <Badge variant={variants[status] || 'outline'}>
      {status}
    </Badge>
  )
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  const currentPage = parseInt(params.page || '1')
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  // Build the query
  let query = supabase
    .from('bookings')
    .select(`
      *,
      property:properties(id, name),
      guest_profile:guest_profiles(id, name, email, phone, avatar_url, total_bookings, average_rating),
      payments:booking_payments(id, status, amount, currency, payment_method, payment_date)
    `, { count: 'exact' })
    .eq('tenant_id', tenant.id)

  // Apply filters
  if (params.search) {
    query = query.or(`guest_name.ilike.%${params.search}%,guest_email.ilike.%${params.search}%`)
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.property && params.property !== 'all') {
    query = query.eq('property_id', params.property)
  }

  // Date range filter
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  switch (params.dateRange) {
    case 'upcoming':
      query = query.gte('check_in', today)
      break
    case 'past':
      query = query.lt('check_out', today)
      break
    case 'today':
      query = query.eq('check_in', today)
      break
    case 'week':
      query = query.gte('check_in', today).lte('check_in', weekEnd)
      break
    case 'month':
      query = query.gte('check_in', today).lte('check_in', monthEnd)
      break
  }

  // Apply sorting
  switch (params.sort) {
    case 'check_in_asc':
      query = query.order('check_in', { ascending: true })
      break
    case 'created_desc':
      query = query.order('created_at', { ascending: false })
      break
    case 'total_desc':
      query = query.order('total_price', { ascending: false, nullsFirst: false })
      break
    case 'total_asc':
      query = query.order('total_price', { ascending: true, nullsFirst: false })
      break
    default:
      query = query.order('check_in', { ascending: false })
  }

  // Apply pagination
  query = query.range(offset, offset + ITEMS_PER_PAGE - 1)

  const { data: bookings, error, count } = await query

  // Get properties for filter dropdown
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('tenant_id', tenant.id)
    .order('name')

  const canEdit = ['OWNER', 'MANAGER'].includes(tenant.role)
  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Transform bookings
  const transformedBookings = bookings?.map(booking => ({
    ...booking,
    property: Array.isArray(booking.property) ? booking.property[0] || null : booking.property,
    guest_profile: Array.isArray(booking.guest_profile) ? booking.guest_profile[0] || null : booking.guest_profile,
    payments: booking.payments || [],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          View and manage your reservations
        </p>
      </div>

      <BookingFilters
        properties={properties || []}
        totalCount={totalCount}
      />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading bookings: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {!transformedBookings || transformedBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-sm text-muted-foreground">
              {params.search || params.status || params.property || params.dateRange
                ? 'Try adjusting your filters'
                : 'Bookings will appear here after syncing with your integrations'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full min-w-[800px]">
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
                    Nights
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-[60px]">

                  </th>
                </tr>
              </thead>
              <tbody>
                {transformedBookings.map((booking: {
                  id: string
                  check_in: string
                  check_out: string
                  guest_name: string | null
                  guest_email: string | null
                  guest_phone: string | null
                  num_guests: number | null
                  status: string
                  total_price: number | null
                  currency: string
                  special_requests: string | null
                  confirmation_code: string | null
                  source_url: string | null
                  notes: string | null
                  property: { id: string; name: string } | null
                  guest_profile: { id: string; name: string; email: string | null; phone: string | null; avatar_url: string | null; total_bookings: number; average_rating: number | null } | null
                  payments: Array<{ id: string; status: string; amount: number; currency: string; payment_method: string | null; payment_date: string | null }>
                }) => {
                  const nights = Math.ceil(
                    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const checkInDate = new Date(booking.check_in)
                  const isUpcoming = checkInDate >= new Date()
                  const isToday = booking.check_in === today

                  return (
                    <tr
                      key={booking.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4 align-middle">
                        <p className="font-medium">{booking.property?.name || 'Unknown'}</p>
                      </td>
                      <td className="p-4 align-middle">
                        <div>
                          <p className="font-medium">{booking.guest_name || '-'}</p>
                          {booking.guest_email && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {booking.guest_email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{booking.check_in}</span>
                          {isToday && (
                            <Badge variant="default" className="text-xs">Today</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-sm">
                        {booking.check_out}
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        {nights}
                      </td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="p-4 align-middle text-right">
                        {booking.total_price ? (
                          <span className="font-medium">
                            {booking.currency} {booking.total_price.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center">
                        <BookingDetailDialog
                          booking={booking}
                          canEdit={canEdit}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </div>
  )
}
