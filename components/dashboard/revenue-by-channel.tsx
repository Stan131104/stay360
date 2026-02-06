'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ChannelRevenueData {
  channel: string
  label: string
  revenue: number
  bookings: number
  percentage: number
}

interface RevenueByChannelProps {
  data: ChannelRevenueData[]
  totalRevenue: number
  className?: string
}

function getChannelLabel(provider: string | null): string {
  if (!provider) return 'Direct'

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function RevenueByChannel({ data, totalRevenue, className }: RevenueByChannelProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue by Channel</CardTitle>
            <CardDescription>Performance across booking platforms</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-muted-foreground">Total revenue</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No revenue data available</p>
            <p className="text-xs mt-1">Revenue will appear here after syncing bookings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((channel, index) => (
              <div key={channel.channel || 'direct'} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{channel.label}</span>
                    <span className="text-muted-foreground">
                      ({channel.bookings} {channel.bookings === 1 ? 'booking' : 'bookings'})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {channel.percentage.toFixed(1)}%
                    </span>
                    <span className="font-semibold tabular-nums w-24 text-right">
                      {formatCurrency(channel.revenue)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/80 rounded-full transition-all duration-500"
                    style={{ width: `${(channel.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        {data.length > 0 && (
          <div className="flex justify-between text-sm pt-4 mt-4 border-t">
            <div>
              <span className="text-muted-foreground">Channels: </span>
              <span className="font-medium">{data.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg/Channel: </span>
              <span className="font-medium">
                {formatCurrency(totalRevenue / data.length)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to process booking data into channel revenue
export function processChannelRevenue(
  bookings: Array<{ source_provider: string | null; total_price: number | null }>
): { data: ChannelRevenueData[]; totalRevenue: number } {
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

  // Convert to array and sort by revenue descending
  const data: ChannelRevenueData[] = Array.from(channelMap.entries())
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
