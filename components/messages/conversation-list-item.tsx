'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Conversation, Property, Booking, GuestProfile } from '@/lib/types/database'

interface ConversationWithRelations extends Conversation {
  property?: Property | null
  booking?: Booking | null
  guest_profile?: GuestProfile | null
}

interface ConversationListItemProps {
  conversation: ConversationWithRelations
  isSelected: boolean
  onClick: () => void
}

function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getPlatformLabel(provider: string | null | undefined): string | null {
  if (!provider) return null

  switch (provider) {
    case 'airbnb_api':
      return 'Airbnb'
    case 'booking_api':
      return 'Booking'
    default:
      return provider.replace(/_/g, ' ')
  }
}

export function ConversationListItem({
  conversation,
  isSelected,
  onClick,
}: ConversationListItemProps) {
  const platformLabel = getPlatformLabel(conversation.source_provider)
  const hasUnread = conversation.unread_count > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 sm:p-4 text-left transition-colors',
        'border-b border-border/50 hover:bg-muted/50',
        isSelected && 'bg-muted',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11">
            <AvatarImage src={conversation.guest_avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-foreground font-medium">
              {conversation.guest_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {hasUnread && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-foreground border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'font-medium truncate text-sm sm:text-base',
              hasUnread && 'font-semibold'
            )}>
              {conversation.guest_name}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatRelativeTime(conversation.last_message_at)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            {platformLabel && (
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {platformLabel}
              </span>
            )}
            {platformLabel && conversation.property && (
              <span className="text-muted-foreground/50">·</span>
            )}
            {conversation.property && (
              <span className="text-xs text-muted-foreground truncate">
                {conversation.property.name}
              </span>
            )}
          </div>

          <p className={cn(
            'text-sm mt-1.5 line-clamp-2',
            hasUnread ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {conversation.last_message_preview || 'No messages yet'}
          </p>
        </div>
      </div>
    </button>
  )
}
