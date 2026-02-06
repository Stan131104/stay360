'use client'

import { cn } from '@/lib/utils'
import { Check, CheckCheck, AlertCircle, Clock } from 'lucide-react'
import type { Message } from '@/lib/types/database'

interface MessageBubbleProps {
  message: Message
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const isSystem = message.sender_type === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex mb-2 sm:mb-3 group',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm',
          isOutbound
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted/80 rounded-bl-sm'
        )}
      >
        {!isOutbound && (
          <p className={cn(
            'text-xs font-medium mb-1',
            isOutbound ? 'text-primary-foreground/80' : 'text-foreground/70'
          )}>
            {message.sender_name}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
        <div
          className={cn(
            'flex items-center gap-1.5 mt-1.5',
            isOutbound ? 'justify-end' : 'justify-start'
          )}
        >
          <span className={cn(
            'text-[10px]',
            isOutbound ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}>
            {formatTime(message.sent_at)}
          </span>
          {isOutbound && (
            <span className="flex items-center">
              {message.delivery_error ? (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                </span>
              ) : message.delivered_to_provider ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/60" />
              ) : (
                <Check className="h-3.5 w-3.5 text-primary-foreground/60" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface MessageDateDividerProps {
  date: string
}

export function MessageDateDivider({ date }: MessageDateDividerProps) {
  return (
    <div className="flex items-center justify-center my-4 sm:my-6">
      <div className="border-t border-border/50 flex-1" />
      <span className="px-3 sm:px-4 text-xs text-muted-foreground font-medium bg-background">
        {formatDate(date)}
      </span>
      <div className="border-t border-border/50 flex-1" />
    </div>
  )
}

// Typing indicator component
export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="bg-muted/80 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{name} is typing...</span>
    </div>
  )
}
