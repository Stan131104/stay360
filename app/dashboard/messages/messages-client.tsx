'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  ConversationListItem,
  MessageBubble,
  MessageDateDivider,
  MessageInput,
  GuestContextPanel,
} from '@/components/messages'
import {
  Search,
  MessageSquare,
  X,
  PanelRightClose,
  PanelRight,
  ArrowLeft,
  Menu,
  Info,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Conversation, Message, Property, Booking, GuestProfile } from '@/lib/types/database'

interface ConversationWithRelations extends Conversation {
  property?: Property | null
  booking?: Booking | null
  guest_profile?: GuestProfile | null
  messages?: Message[]
}

interface MessagesClientProps {
  initialConversations: ConversationWithRelations[]
  totalCount: number
  platforms: string[]
  canReply: boolean
  tenantId: string
}

function getPlatformLabel(provider: string): string {
  switch (provider) {
    case 'airbnb_api':
      return 'Airbnb'
    case 'booking_api':
      return 'Booking.com'
    default:
      return provider.replace(/_/g, ' ')
  }
}

function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: Map<string, Message[]> = new Map()

  for (const message of messages) {
    const date = new Date(message.sent_at).toDateString()
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(message)
  }

  return Array.from(groups.entries()).map(([date, msgs]) => ({
    date,
    messages: msgs,
  }))
}

export function MessagesClient({
  initialConversations,
  totalCount,
  platforms,
  canReply,
  tenantId,
}: MessagesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithRelations | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [activePlatform, setActivePlatform] = useState(searchParams.get('platform') || 'all')
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [showContextPanel, setShowContextPanel] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [showMobileList, setShowMobileList] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    if (selectedConversation?.messages?.length) {
      // Use instant scroll on initial load, smooth on updates
      scrollToBottom('instant')
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    if (selectedConversation?.messages?.length) {
      scrollToBottom('smooth')
    }
  }, [selectedConversation?.messages?.length, scrollToBottom])

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message

          // Update selected conversation if it matches
          if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
            setSelectedConversation(prev => prev ? {
              ...prev,
              messages: [...(prev.messages || []), newMessage],
            } : null)
          }

          // Refresh conversation list to update previews
          const response = await fetch('/api/messages')
          if (response.ok) {
            const data = await response.json()
            setConversations(data.conversations)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async () => {
          // Refresh conversation list
          const response = await fetch('/api/messages')
          if (response.ok) {
            const data = await response.json()
            setConversations(data.conversations)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, tenantId, selectedConversation])

  // Load conversation details
  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoadingConversation(true)
    setMobileView('chat')
    try {
      const response = await fetch(`/api/messages/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data)

        // Update conversation in list to reflect read status
        setConversations(prev =>
          prev.map(c =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
          )
        )
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      setIsLoadingConversation(false)
    }
  }, [])

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery) {
      params.set('search', searchQuery)
    } else {
      params.delete('search')
    }
    router.push(`/dashboard/messages?${params.toString()}`)
  }, [searchQuery, searchParams, router])

  // Handle platform filter
  const handlePlatformChange = useCallback((platform: string) => {
    setActivePlatform(platform)
    const params = new URLSearchParams(searchParams.toString())
    if (platform && platform !== 'all') {
      params.set('platform', platform)
    } else {
      params.delete('platform')
    }
    router.push(`/dashboard/messages?${params.toString()}`)
  }, [searchParams, router])

  // Handle message sent
  const handleMessageSent = useCallback(() => {
    if (selectedConversation) {
      loadConversation(selectedConversation.id)
    }
  }, [selectedConversation, loadConversation])

  // Handle back to list on mobile
  const handleBackToList = useCallback(() => {
    setMobileView('list')
    setSelectedConversation(null)
  }, [])

  const messageGroups = selectedConversation?.messages
    ? groupMessagesByDate(selectedConversation.messages)
    : []

  // Conversation List Component (reusable for desktop and mobile)
  const ConversationList = ({ className }: { className?: string }) => (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-3 border-b space-y-3 flex-shrink-0">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete('search')
                  router.push(`/dashboard/messages?${params.toString()}`)
                }}
                className="absolute right-2.5 top-2.5"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </form>

        {platforms.length > 0 && (
          <Tabs value={activePlatform} onValueChange={handlePlatformChange}>
            <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${platforms.length + 1}, 1fr)` }}>
              <TabsTrigger value="all">All</TabsTrigger>
              {platforms.map(platform => (
                <TabsTrigger key={platform} value={platform} className="truncate">
                  {getPlatformLabel(platform)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No conversations</p>
            <p className="text-sm mt-1">Messages will appear here after syncing</p>
          </div>
        ) : (
          conversations.map(conversation => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation?.id === conversation.id}
              onClick={() => {
                loadConversation(conversation.id)
                setShowMobileList(false)
              }}
            />
          ))
        )}
      </ScrollArea>
    </div>
  )

  // Chat View Component
  const ChatView = () => (
    <div className="flex flex-col h-full">
      {!selectedConversation ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="font-medium text-lg mb-1">Select a conversation</h3>
            <p className="text-sm">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b flex items-center gap-3 flex-shrink-0 bg-background">
            {/* Back button on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0"
              onClick={handleBackToList}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{selectedConversation.guest_name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedConversation.source_provider && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {getPlatformLabel(selectedConversation.source_provider)}
                  </Badge>
                )}
                {selectedConversation.property && (
                  <span className="text-xs text-muted-foreground truncate">
                    {selectedConversation.property.name}
                  </span>
                )}
              </div>
            </div>

            {/* Context panel toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowContextPanel(!showContextPanel)}
              className="flex-shrink-0 hidden sm:flex"
            >
              {showContextPanel ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRight className="h-5 w-5" />
              )}
            </Button>

            {/* Mobile context sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0 sm:hidden">
                  <Info className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 p-0">
                <GuestContextPanel conversation={selectedConversation} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1"
          >
            {isLoadingConversation ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messageGroups.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No messages yet</p>
              </div>
            ) : (
              <>
                {messageGroups.map(group => (
                  <div key={group.date}>
                    <MessageDateDivider date={group.messages[0].sent_at} />
                    {group.messages.map(message => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0">
            <MessageInput
              conversationId={selectedConversation.id}
              disabled={!canReply}
              onMessageSent={handleMessageSent}
            />
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} conversation{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Mobile menu button */}
        <Sheet open={showMobileList} onOpenChange={setShowMobileList}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:w-80 p-0">
            <ConversationList />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Desktop: Conversation List */}
        <Card className="hidden lg:flex w-80 xl:w-96 flex-col flex-shrink-0">
          <ConversationList />
        </Card>

        {/* Mobile: Show list or chat based on state */}
        <div className="flex-1 flex gap-4 min-h-0 lg:contents">
          {/* Mobile list view */}
          <Card className={cn(
            'flex-1 flex flex-col lg:hidden',
            mobileView === 'chat' && selectedConversation && 'hidden'
          )}>
            <ConversationList />
          </Card>

          {/* Chat view (both mobile when selected and desktop always) */}
          <Card className={cn(
            'flex-1 flex flex-col min-w-0',
            // Hide on mobile when no conversation or in list view
            'hidden lg:flex',
            mobileView === 'chat' && selectedConversation && '!flex'
          )}>
            <ChatView />
          </Card>

          {/* Desktop: Context Panel */}
          {showContextPanel && selectedConversation && (
            <Card className="hidden xl:flex w-72 flex-shrink-0 flex-col">
              <GuestContextPanel conversation={selectedConversation} />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
