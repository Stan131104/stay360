import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { MessagesClient } from './messages-client'

interface SearchParams {
  platform?: string
  status?: string
  search?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  // Build initial query
  let query = supabase
    .from('conversations')
    .select(`
      *,
      property:properties(id, name, thumbnail_url),
      booking:bookings(id, check_in, check_out, confirmation_code, status, total_price, currency, num_guests),
      guest_profile:guest_profiles(id, name, email, phone, avatar_url, total_bookings, average_rating)
    `, { count: 'exact' })
    .eq('tenant_id', tenant.id)

  // Apply filters
  if (params.platform && params.platform !== 'all') {
    query = query.eq('source_provider', params.platform)
  }

  const status = params.status || 'active'
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (params.search) {
    query = query.or(`guest_name.ilike.%${params.search}%,subject.ilike.%${params.search}%,last_message_preview.ilike.%${params.search}%`)
  }

  query = query
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50)

  const { data: conversations, error, count } = await query

  // Get available platforms for filter
  const { data: platforms } = await supabase
    .from('conversations')
    .select('source_provider')
    .eq('tenant_id', tenant.id)
    .not('source_provider', 'is', null)

  const uniquePlatforms = [...new Set(platforms?.map(p => p.source_provider).filter(Boolean))]

  // Transform relations
  const transformedConversations = conversations?.map(conv => ({
    ...conv,
    property: Array.isArray(conv.property) ? conv.property[0] || null : conv.property,
    booking: Array.isArray(conv.booking) ? conv.booking[0] || null : conv.booking,
    guest_profile: Array.isArray(conv.guest_profile) ? conv.guest_profile[0] || null : conv.guest_profile,
  })) || []

  const canReply = ['OWNER', 'MANAGER'].includes(tenant.role)

  return (
    <MessagesClient
      initialConversations={transformedConversations}
      totalCount={count || 0}
      platforms={uniquePlatforms as string[]}
      canReply={canReply}
      tenantId={tenant.id}
    />
  )
}
