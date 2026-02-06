'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RevenueDataPoint {
  month: string
  revenue: number
  bookings: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  className?: string
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalBookings = data.reduce((sum, d) => sum + d.bookings, 0)

  // Calculate trend (last 3 months vs previous 3 months)
  const recentMonths = data.slice(-3)
  const previousMonths = data.slice(-6, -3)
  const recentTotal = recentMonths.reduce((sum, d) => sum + d.revenue, 0)
  const previousTotal = previousMonths.reduce((sum, d) => sum + d.revenue, 0)
  const trend = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the past 6 months</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </div>
            <div className={cn(
              'text-sm',
              trend > 0 && 'text-green-600 dark:text-green-400',
              trend < 0 && 'text-red-600 dark:text-red-400',
              trend === 0 && 'text-muted-foreground'
            )}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs prev period
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-40 mb-4">
          {data.map((point, index) => {
            const height = (point.revenue / maxRevenue) * 100
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex flex-col items-center justify-end h-32">
                  <div
                    className="w-full max-w-12 bg-primary/80 rounded-t hover:bg-primary transition-colors cursor-default group relative"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap">
                        <div className="font-semibold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(point.revenue)}
                        </div>
                        <div className="text-muted-foreground">
                          {point.bookings} bookings
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{point.month}</span>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="flex justify-between text-sm pt-4 border-t">
          <div>
            <span className="text-muted-foreground">Total Bookings: </span>
            <span className="font-medium">{totalBookings}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg/Booking: </span>
            <span className="font-medium">
              {totalBookings > 0
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(totalRevenue / totalBookings)
                : '$0'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to generate mock data for development
export function generateMockRevenueData(): RevenueDataPoint[] {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
  return months.map((month, i) => ({
    month,
    revenue: Math.floor(Math.random() * 15000) + 5000 + i * 1000,
    bookings: Math.floor(Math.random() * 20) + 5 + i * 2,
  }))
}
