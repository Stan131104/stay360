'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CalendarPlus,
  RefreshCw,
  Star,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  LucideIcon,
} from 'lucide-react'

export type ActivityType =
  | 'booking_new'
  | 'booking_cancelled'
  | 'sync_completed'
  | 'sync_failed'
  | 'review_new'
  | 'message_new'
  | 'check_in'
  | 'check_out'

interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: Date
  metadata?: {
    propertyName?: string
    guestName?: string
    rating?: number
    status?: string
  }
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  className?: string
  maxItems?: number
}

const activityConfig: Record<ActivityType, { icon: LucideIcon; color: string }> = {
  booking_new: { icon: CalendarPlus, color: 'text-green-500' },
  booking_cancelled: { icon: XCircle, color: 'text-red-500' },
  sync_completed: { icon: RefreshCw, color: 'text-blue-500' },
  sync_failed: { icon: AlertCircle, color: 'text-red-500' },
  review_new: { icon: Star, color: 'text-yellow-500' },
  message_new: { icon: MessageSquare, color: 'text-purple-500' },
  check_in: { icon: CheckCircle, color: 'text-green-500' },
  check_out: { icon: Clock, color: 'text-orange-500' },
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function ActivityFeed({ activities, className, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates across your properties</CardDescription>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity) => {
              const config = activityConfig[activity.type]
              const Icon = config.icon

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn('mt-0.5 p-1.5 rounded-full bg-muted', config.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {activity.description}
                    </p>
                    {activity.metadata?.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-3 w-3',
                              i < activity.metadata!.rating!
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-muted-foreground'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activities.length > maxItems && (
          <div className="mt-4 pt-4 border-t text-center">
            <a
              href="/dashboard/bookings"
              className="text-sm text-primary hover:underline"
            >
              View all activity
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

