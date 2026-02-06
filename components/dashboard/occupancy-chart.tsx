'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface OccupancyDataPoint {
  property: string
  propertyId: string
  occupancy: number // 0-100
  bookedNights: number
  totalNights: number
}

interface OccupancyChartProps {
  data: OccupancyDataPoint[]
  className?: string
}

export function OccupancyChart({ data, className }: OccupancyChartProps) {
  const averageOccupancy = data.length > 0
    ? data.reduce((sum, d) => sum + d.occupancy, 0) / data.length
    : 0

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 60) return 'bg-yellow-500'
    if (rate >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getOccupancyTextColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400'
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (rate >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Occupancy by Property</CardTitle>
            <CardDescription>Last 30 days occupancy rates</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{averageOccupancy.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">avg occupancy</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No properties to display
          </p>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.propertyId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[200px]">{item.property}</span>
                  <span className={cn('font-semibold', getOccupancyTextColor(item.occupancy))}>
                    {item.occupancy.toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('absolute top-0 left-0 h-full rounded-full transition-all', getOccupancyColor(item.occupancy))}
                    style={{ width: `${item.occupancy}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.bookedNights} nights booked</span>
                  <span>{item.totalNights - item.bookedNights} available</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        {data.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>80%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>&lt;40%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper to generate mock data for development
export function generateMockOccupancyData(): OccupancyDataPoint[] {
  return [
    { property: 'Beach House', propertyId: '1', occupancy: 85, bookedNights: 26, totalNights: 30 },
    { property: 'Downtown Loft', propertyId: '2', occupancy: 67, bookedNights: 20, totalNights: 30 },
    { property: 'Mountain Cabin', propertyId: '3', occupancy: 45, bookedNights: 14, totalNights: 30 },
    { property: 'City Apartment', propertyId: '4', occupancy: 93, bookedNights: 28, totalNights: 30 },
  ]
}
