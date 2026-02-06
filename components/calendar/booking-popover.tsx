'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar, User, Building2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Booking {
  id: string
  check_in: string
  check_out: string
  guest_name: string | null
  status: string
  total_price?: number | null
  currency?: string
  property: { id: string; name: string } | null
}

interface BookingPopoverProps {
  booking: Booking
  children: React.ReactNode
}

const statusColors: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
  blocked: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200' },
}

export function BookingPopover({ booking, children }: BookingPopoverProps) {
  const colors = statusColors[booking.status] || statusColors.pending

  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72" side="right" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {booking.guest_name || 'Blocked'}
              </p>
              <Badge className={`${colors.bg} ${colors.text} mt-1`}>
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Property */}
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{booking.property?.name || 'Unknown'}</span>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p>{booking.check_in} → {booking.check_out}</p>
              <p className="text-xs text-muted-foreground">{nights} nights</p>
            </div>
          </div>

          {/* Price */}
          {booking.total_price && (
            <div className="text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium">
                {booking.currency || 'USD'} {booking.total_price.toLocaleString()}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/dashboard/bookings?search=${booking.guest_name || ''}`}>
                View Details
              </Link>
            </Button>
            {booking.property && (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href={`/dashboard/properties/${booking.property.id}`}>
                  Property
                </Link>
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
