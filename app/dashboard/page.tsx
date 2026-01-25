import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, CalendarDays, DollarSign, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  // Fetch dashboard stats
  const [
    { count: propertiesCount },
    { count: bookingsCount },
    { data: upcomingBookings },
    { data: integrations },
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id),
    supabase
      .from('bookings')
      .select('id, check_in, check_out, guest_name, status, property:properties(name)')
      .eq('tenant_id', tenant.id)
      .gte('check_in', new Date().toISOString().split('T')[0])
      .order('check_in', { ascending: true })
      .limit(5),
    supabase
      .from('integrations')
      .select('id, name, provider, status, last_sync_at, last_error')
      .eq('tenant_id', tenant.id),
  ])

  const activeIntegrations = integrations?.filter(i => i.status === 'active').length || 0
  const errorIntegrations = integrations?.filter(i => i.status === 'error').length || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to {tenant.name}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertiesCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total reservations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIntegrations}</div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorIntegrations}</div>
            <p className="text-xs text-muted-foreground">
              Sync errors
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Next 5 check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            {!upcomingBookings || upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {booking.guest_name || 'Guest'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(booking.property as unknown as { name: string } | null)?.name || 'Unknown'} &middot; {booking.check_in} to {booking.check_out}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : booking.status === 'blocked'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integrations status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Connected data sources</CardDescription>
          </CardHeader>
          <CardContent>
            {!integrations || integrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No integrations connected.{' '}
                <a href="/onboarding/connect" className="text-primary hover:underline">
                  Connect your first integration
                </a>
              </p>
            ) : (
              <div className="space-y-4">
                {integrations.map((integration: {
                  id: string
                  name: string
                  provider: string
                  status: string
                  last_sync_at: string | null
                  last_error: string | null
                }) => (
                  <div key={integration.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {integration.provider.replace(/_/g, ' ')}
                        {integration.last_sync_at && (
                          <> &middot; Last sync: {new Date(integration.last_sync_at).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      integration.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : integration.status === 'error'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {integration.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
