'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  Home,
  Mail,
  Phone,
  Star,
  Users,
  ExternalLink,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation, Property, Booking, GuestProfile } from '@/lib/types/database'

interface ConversationWithRelations extends Conversation {
  property?: Property | null
  booking?: Booking | null
  guest_profile?: GuestProfile | null
}

interface GuestContextPanelProps {
  conversation: ConversationWithRelations | null
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function GuestContextPanel({ conversation }: GuestContextPanelProps) {
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-6">
        <p className="text-sm text-center">Select a conversation to view guest details</p>
      </div>
    )
  }

  const guest = conversation.guest_profile
  const booking = conversation.booking
  const property = conversation.property

  return (
    <div className="h-full overflow-y-auto">
      {/* Guest Header */}
      <div className="p-4 sm:p-5 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarImage src={conversation.guest_avatar_url || guest?.avatar_url || undefined} />
            <AvatarFallback className="text-lg bg-muted">
              {conversation.guest_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{conversation.guest_name}</h3>
            {guest && (
              <div className="flex items-center gap-3 mt-1">
                {guest.average_rating && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5" />
                    <span>{guest.average_rating.toFixed(1)}</span>
                  </div>
                )}
                {guest.total_bookings > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {guest.total_bookings} {guest.total_bookings === 1 ? 'stay' : 'stays'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-2">
          {(guest?.email || conversation.guest_profile?.email) && (
            <a
              href={`mailto:${guest?.email || conversation.guest_profile?.email}`}
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{guest?.email || conversation.guest_profile?.email}</span>
            </a>
          )}
          {(guest?.phone || conversation.guest_profile?.phone) && (
            <a
              href={`tel:${guest?.phone || conversation.guest_profile?.phone}`}
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{guest?.phone || conversation.guest_profile?.phone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Booking Details */}
      {booking && (
        <div className="p-4 sm:p-5 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Reservation</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={cn(
                'text-sm font-medium capitalize',
                booking.status === 'confirmed' && 'text-foreground',
                booking.status === 'cancelled' && 'text-muted-foreground line-through',
                booking.status === 'pending' && 'text-muted-foreground'
              )}>
                {booking.status}
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Check-in</p>
                <p className="text-sm font-medium">{formatDate(booking.check_in)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Check-out</p>
                <p className="text-sm font-medium">{formatDate(booking.check_out)}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-sm">Guests</span>
              </div>
              <span className="text-sm font-medium">{booking.num_guests || '-'}</span>
            </div>

            {booking.total_price && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(booking.total_price, booking.currency)}
                </span>
              </div>
            )}

            {booking.confirmation_code && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confirmation</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {booking.confirmation_code}
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Details */}
      {property && (
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Home className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Property</h4>
          </div>

          <div className="flex gap-3">
            {property.thumbnail_url && (
              <img
                src={property.thumbnail_url}
                alt={property.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-muted"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{property.name}</p>
              {(property.city || property.address) && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{property.city || property.address}</span>
                </p>
              )}
              {property.listing_url && (
                <a
                  href={property.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-2 transition-colors"
                >
                  View listing
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
