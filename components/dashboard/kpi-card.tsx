'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Building2,
  CalendarCheck,
  Users,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type IconName = 'dollar-sign' | 'trending-up' | 'building' | 'calendar-check' | 'users' | 'star'

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'building': Building2,
  'calendar-check': CalendarCheck,
  'users': Users,
  'star': Star,
}

interface KpiCardProps {
  title: string
  value: string | number
  description?: string
  icon: IconName
  trend?: {
    value: number
    label: string
  }
  format?: 'number' | 'currency' | 'percent'
  className?: string
}

export function KpiCard({
  title,
  value,
  description,
  icon,
  trend,
  format = 'number',
  className,
}: KpiCardProps) {
  const Icon = iconMap[icon] || DollarSign
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      case 'percent':
        return `${val.toFixed(1)}%`
      default:
        return new Intl.NumberFormat('en-US').format(val)
    }
  }

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return TrendingUp
    if (trend.value < 0) return TrendingDown
    return Minus
  }

  const TrendIcon = getTrendIcon()

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && TrendIcon && (
          <div className={cn(
            'flex items-center gap-1 text-xs mt-2',
            trend.value > 0 && 'text-green-600 dark:text-green-400',
            trend.value < 0 && 'text-red-600 dark:text-red-400',
            trend.value === 0 && 'text-muted-foreground'
          )}>
            <TrendIcon className="h-3 w-3" />
            <span>
              {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
