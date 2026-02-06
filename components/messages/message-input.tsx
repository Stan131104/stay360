'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  conversationId: string
  disabled?: boolean
  onMessageSent?: () => void
}

export function MessageInput({
  conversationId,
  disabled = false,
  onMessageSent,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [content])

  const handleSend = useCallback(async () => {
    if (!content.trim() || isSending || disabled) return

    setIsSending(true)
    setError(null)

    try {
      const response = await fetch(`/api/messages/${conversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      setContent('')
      onMessageSent?.()

      // Refocus textarea
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setIsSending(false)
    }
  }, [content, conversationId, disabled, isSending, onMessageSent])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter without Shift (desktop behavior)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (disabled) {
    return (
      <div className="border-t p-3 sm:p-4 bg-muted/30">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>You don&apos;t have permission to send messages</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t bg-background">
      {error && (
        <div className="px-3 sm:px-4 py-2 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={cn(
                'min-h-[44px] max-h-[120px] resize-none pr-12 sm:pr-4',
                'focus-visible:ring-1 focus-visible:ring-primary'
              )}
              rows={1}
              disabled={isSending}
            />
            {/* Mobile send button inside textarea */}
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!content.trim() || isSending}
              className="absolute right-1.5 bottom-1.5 h-8 w-8 sm:hidden"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {/* Desktop send button */}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            className="hidden sm:flex h-10 w-10"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="hidden sm:block text-xs text-muted-foreground mt-2">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}
