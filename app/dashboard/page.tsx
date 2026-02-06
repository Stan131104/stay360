import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { OccupancyChart } from '@/components/dashboard/occupancy-chart'
import { RevenueByChannel } from '@/components/dashboard/revenue-by-channel'
import { ActivityFeed, type ActivityType } from '@/components/dashboard/activity-feed'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default async function DashboardPage() {
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  // Current date helpers
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Fetch dashboard data in parallel
  const [
    propertiesResult,
    bookingsResult,
    upcomingBookingsResult,
    integrationsResult,
    thisMonthRevenueResult,
    lastMonthRevenueResult,
    recentBookingsResult,
    reviewsResult,
    syncRunsResult,
    monthlyRevenueResult,
    occupancyBookingsResult,
    channelRevenueResult,
  ] = await Promise.all([
    // Total properties
    supabase
      .from('properties')
      .select('id, name, is_active', { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .eq('is_active', true),
    // Total bookings
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id),
    // Upcoming bookings (next 7 days check-ins)
    supabase
      .from('bookings')
      .select('id, check_in, check_out, guest_name, status, total_price, property:properties(name)')
      .eq('tenant_id', tenant.id)
      .gte('check_in', now.toISOString().split('T')[0])
      .lte('check_in', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('check_in', { ascending: true })
      .limit(5),
    // Integrations
    supabase
      .from('integrations')
      .select('id, name, provider, status, last_sync_at, last_error')
      .eq('tenant_id', tenant.id),
    // This month revenue
    supabase
      .from('bookings')
      .select('total_price')
      .eq('tenant_id', tenant.id)
      .eq('status', 'confirmed')
      .gte('check_in', thisMonthStart.toISOString().split('T')[0]),
    // Last month revenue
    supabase
      .from('bookings')
      .select('total_price')
      .eq('tenant_id', tenant.id)
      .eq('status', 'confirmed')
      .gte('check_in', lastMonthStart.toISOString().split('T')[0])
      .lte('check_in', lastMonthEnd.toISOString().split('T')[0]),
    // Recent bookings for activity feed
    supabase
      .from('bookings')
      .select('id, created_at, guest_name, status, property:properties(name)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(10),
    // Recent reviews
    supabase
      .from('guest_reviews')
      .select('id, created_at, reviewer_name, rating, property:properties(name)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(5),
    // Recent sync runs
    supabase
      .from('sync_runs')
      .select('id, started_at, status, properties_synced, bookings_synced, integration:integrations(name)')
      .eq('tenant_id', tenant.id)
      .order('started_at', { ascending: false })
      .limit(5),
    // Monthly revenue for last 6 months
    supabase
      .from('bookings')
      .select('check_in, total_price, id')
      .eq('tenant_id', tenant.id)
      .eq('status', 'confirmed')
      .gte('check_in', sixMonthsAgo.toISOString().split('T')[0]),
    // Bookings for occupancy calculation (last 30 days)
    supabase
      .from('bookings')
      .select('property_id, check_in, check_out')
      .eq('tenant_id', tenant.id)
      .in('status', ['confirmed', 'blocked'])
      .lte('check_in', now.toISOString().split('T')[0])
      .gte('check_out', thirtyDaysAgo.toISOString().split('T')[0]),
    // Revenue by channel (this month)
    supabase
      .from('bookings')
      .select('source_provider, total_price')
      .eq('tenant_id', tenant.id)
      .eq('status', 'confirmed')
      .gte('check_in', thisMonthStart.toISOString().split('T')[0]),
  ])

  // Calculate stats
  const propertiesCount = propertiesResult.count || 0
  const bookingsCount = bookingsResult.count || 0
  const properties = propertiesResult.data || []

  const thisMonthRevenue = thisMonthRevenueResult.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
  const lastMonthRevenue = lastMonthRevenueResult.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
  const revenueTrend = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

  const upcomingCheckIns = upcomingBookingsResult.data?.length || 0

  const activeIntegrations = integrationsResult.data?.filter(i => i.status === 'active').length || 0

  // Calculate average review rating
  const reviews = reviewsResult.data || []
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  // Calculate occupancy for last 30 days from actual booking data
  const calculateOccupancy = () => {
    const totalDays = 30
    const occupancyBookings = occupancyBookingsResult.data || []
    const periodStart = thirtyDaysAgo
    const periodEnd = now

    const occupancyData = properties.map(prop => {
      const propBookings = occupancyBookings.filter(b => b.property_id === prop.id)
      let bookedNights = 0

      for (const booking of propBookings) {
        const checkIn = new Date(booking.check_in)
        const checkOut = new Date(booking.check_out)
        // Clamp to the 30-day window
        const effectiveStart = checkIn > periodStart ? checkIn : periodStart
        const effectiveEnd = checkOut < periodEnd ? checkOut : periodEnd
        const nights = Math.max(0, Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (24 * 60 * 60 * 1000)))
        bookedNights += nights
      }

      // Cap at totalDays in case of overlapping bookings
      bookedNights = Math.min(bookedNights, totalDays)

      return {
        property: prop.name,
        propertyId: prop.id,
        occupancy: (bookedNights / totalDays) * 100,
        bookedNights,
        totalNights: totalDays,
      }
    })
    return occupancyData
  }

  const occupancyData = calculateOccupancy()
  const avgOccupancy = occupancyData.length > 0
    ? occupancyData.reduce((sum, d) => sum + d.occupancy, 0) / occupancyData.length
    : 0

  // Build revenue chart data
  const buildRevenueData = () => {
    const months: { [key: string]: { revenue: number; bookings: number } } = {}
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      months[key] = { revenue: 0, bookings: 0 }
    }

    // Aggregate revenue from bookings
    monthlyRevenueResult.data?.forEach(booking => {
      if (booking.check_in) {
        const checkIn = new Date(booking.check_in)
        const key = `${checkIn.getFullYear()}-${checkIn.getMonth()}`
        if (months[key]) {
          months[key].revenue += booking.total_price || 0
          months[key].bookings += 1
        }
      }
    })

    return Object.entries(months).map(([key, value]) => {
      const [year, month] = key.split('-').map(Number)
      return {
        month: monthNames[month],
        revenue: value.revenue,
        bookings: value.bookings,
      }
    })
  }

  const revenueData = buildRevenueData()

  // Process channel revenue data
  const buildChannelRevenue = () => {
    const bookings = channelRevenueResult.data || []
    const channelMap = new Map<string, { revenue: number; bookings: number }>()

    // Aggregate revenue by channel
    for (const booking of bookings) {
      const channel = booking.source_provider || 'direct'
      const existing = channelMap.get(channel) || { revenue: 0, bookings: 0 }
      channelMap.set(channel, {
        revenue: existing.revenue + (booking.total_price || 0),
        bookings: existing.bookings + 1,
      })
    }

    const totalRevenue = Array.from(channelMap.values()).reduce((sum, c) => sum + c.revenue, 0)

    // Helper to get friendly channel label
    const getChannelLabel = (provider: string | null): string => {
      if (!provider || provider === 'direct') return 'Direct'
      switch (provider) {
        case 'airbnb_api':
        case 'airbnb_ical':
          return 'Airbnb'
        case 'booking_api':
        case 'booking_ical':
          return 'Booking.com'
        case 'vrbo_ical':
          return 'VRBO'
        case 'channel_manager_guesty':
          return 'Guesty'
        case 'channel_manager_hostaway':
          return 'Hostaway'
        case 'channel_manager_mock':
          return 'Channel Manager'
        default:
          if (provider.includes('ical')) return 'iCal'
          return provider.replace(/_/g, ' ')
      }
    }

    // Convert to array and sort by revenue descending
    const data = Array.from(channelMap.entries())
      .map(([channel, stats]) => ({
        channel,
        label: getChannelLabel(channel === 'direct' ? null : channel),
        revenue: stats.revenue,
        bookings: stats.bookings,
        percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return { data, totalRevenue }
  }

  const channelRevenue = buildChannelRevenue()

  // Build activity feed
  const buildActivityFeed = () => {
    const activities: Array<{
      id: string
      type: ActivityType
      title: string
      description: string
      timestamp: Date
      metadata?: { propertyName?: string; guestName?: string; rating?: number }
    }> = []

    // Add recent bookings
    recentBookingsResult.data?.forEach(booking => {
      const propertyName = (booking.property as unknown as { name: string } | null)?.name || 'Unknown'
      activities.push({
        id: `booking-${booking.id}`,
        type: booking.status === 'cancelled' ? 'booking_cancelled' : 'booking_new',
        title: booking.status === 'cancelled' ? 'Booking Cancelled' : 'New Booking',
        description: `${booking.guest_name || 'Guest'} at ${propertyName}`,
        timestamp: new Date(booking.created_at),
        metadata: { propertyName, guestName: booking.guest_name || undefined },
      })
    })

    // Add recent reviews
    reviews.forEach(review => {
      const propertyName = (review.property as unknown as { name: string } | null)?.name || 'Unknown'
      activities.push({
        id: `review-${review.id}`,
        type: 'review_new',
        title: 'New Review',
        description: `${review.reviewer_name} left a ${review.rating}-star review for ${propertyName}`,
        timestamp: new Date(review.created_at),
        metadata: { propertyName, guestName: review.reviewer_name, rating: review.rating },
      })
    })

    // Add recent syncs
    syncRunsResult.data?.forEach(sync => {
      const integrationName = (sync.integration as unknown as { name: string } | null)?.name || 'Integration'
      activities.push({
        id: `sync-${sync.id}`,
        type: sync.status === 'completed' ? 'sync_completed' : 'sync_failed',
        title: sync.status === 'completed' ? 'Sync Completed' : 'Sync Failed',
        description: `${integrationName}: ${sync.properties_synced} properties, ${sync.bookings_synced} bookings`,
        timestamp: new Date(sync.started_at),
      })
    })

    // Sort by timestamp
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10)
  }

  const activityFeed = buildActivityFeed()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to {tenant.name}
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {tenant.default_currency || 'USD'}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={thisMonthRevenue}
          description="This month"
          icon="dollar-sign"
          format="currency"
          trend={{
            value: revenueTrend,
            label: 'vs last month',
          }}
        />
        <KpiCard
          title="Occupancy Rate"
          value={avgOccupancy}
          description="Last 30 days"
          icon="trending-up"
          format="percent"
        />
        <KpiCard
          title="Properties"
          value={propertiesCount}
          description="Active listings"
          icon="building"
        />
        <KpiCard
          title="Upcoming Check-ins"
          value={upcomingCheckIns}
          description="Next 7 days"
          icon="calendar-check"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart data={revenueData} />
        <OccupancyChart data={occupancyData} />
      </div>

      {/* Revenue by Channel */}
      <RevenueByChannel
        data={channelRevenue.data}
        totalRevenue={channelRevenue.totalRevenue}
      />

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity Feed */}
        <ActivityFeed activities={activityFeed} className="lg:col-span-2" />

        {/* Quick Actions */}
        <QuickActions />
      </div>

      {/* Upcoming Bookings Detail */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Next check-ins this week</CardDescription>
          </CardHeader>
          <CardContent>
            {!upcomingBookingsResult.data || upcomingBookingsResult.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming bookings this week</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookingsResult.data.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {booking.guest_name || 'Guest'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(booking.property as unknown as { name: string } | null)?.name || 'Unknown'} &middot; {booking.check_in} to {booking.check_out}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.total_price && (
                        <span className="text-sm font-medium">
                          ${booking.total_price}
                        </span>
                      )}
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'blocked' ? 'secondary' : 'outline'
                      }>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Connected data sources</CardDescription>
          </CardHeader>
          <CardContent>
            {!integrationsResult.data || integrationsResult.data.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  No integrations connected yet
                </p>
                <a
                  href="/onboarding/connect"
                  className="text-sm text-primary hover:underline"
                >
                  Connect your first integration
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {integrationsResult.data.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {integration.provider.replace(/_/g, ' ')}
                        {integration.last_sync_at && (
                          <> &middot; Synced {new Date(integration.last_sync_at).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <Badge variant={
                      integration.status === 'active' ? 'default' :
                      integration.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {integration.status}
                    </Badge>
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
