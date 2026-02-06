'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PlatformCardProps {
  name: string
  description: string
  icon: React.ReactNode
  features: string[]
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function PlatformCard({
  name,
  description,
  icon,
  features,
  badge,
  badgeVariant = 'secondary',
  selected,
  disabled,
  onClick,
}: PlatformCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        !disabled && 'cursor-pointer hover:shadow-md hover:border-primary',
        selected && 'border-primary ring-2 ring-primary ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-primary">
            {icon}
          </div>
          {badge && (
            <Badge variant={badgeVariant}>{badge}</Badge>
          )}
        </div>
        <CardTitle className="mt-3">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-sm text-muted-foreground space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className={feature.startsWith('-') ? 'text-red-500' : 'text-green-500'}>
                {feature.startsWith('-') ? '−' : '+'}
              </span>
              <span>{feature.replace(/^[+-]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
