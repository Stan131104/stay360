'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Plus,
  RefreshCw,
  CalendarOff,
  Download,
  Settings,
  Link as LinkIcon,
  LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
  label: string
  description: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'secondary'
}

interface QuickActionsProps {
  onSyncAll?: () => void
  onBlockDates?: () => void
  onExport?: () => void
  isLoading?: {
    sync?: boolean
    block?: boolean
    export?: boolean
  }
  className?: string
}

export function QuickActions({
  onSyncAll,
  onBlockDates,
  onExport,
  isLoading = {},
  className,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: 'Add Property',
      description: 'Create a new listing',
      icon: Plus,
      href: '/dashboard/properties/new',
      variant: 'default',
    },
    {
      label: 'Sync All',
      description: 'Update from all sources',
      icon: RefreshCw,
      onClick: onSyncAll,
      variant: 'outline',
    },
    {
      label: 'Block Dates',
      description: 'Mark dates unavailable',
      icon: CalendarOff,
      onClick: onBlockDates,
      variant: 'outline',
    },
    {
      label: 'Connect Platform',
      description: 'Add new integration',
      icon: LinkIcon,
      href: '/onboarding/connect',
      variant: 'outline',
    },
  ]

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks at your fingertips</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            const isActionLoading = action.label === 'Sync All' ? isLoading.sync :
                                    action.label === 'Block Dates' ? isLoading.block :
                                    action.label === 'Export' ? isLoading.export : false

            if (action.href) {
              return (
                <Link key={index} href={action.href} className="block">
                  <Button
                    variant={action.variant}
                    className="w-full h-auto py-4 px-4 flex flex-col items-start gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{action.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-normal">
                      {action.description}
                    </span>
                  </Button>
                </Link>
              )
            }

            return (
              <Button
                key={index}
                variant={action.variant}
                className="w-full h-auto py-4 px-4 flex flex-col items-start gap-1"
                onClick={action.onClick}
                disabled={isActionLoading}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', isActionLoading && 'animate-spin')} />
                  <span className="font-medium">{action.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  {action.description}
                </span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
