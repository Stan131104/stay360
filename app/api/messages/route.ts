import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'

export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status') || 'active'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('conversations')
      .select(`
        *,
        property:properties(id, name, thumbnail_url),
        booking:bookings(id, check_in, check_out, confirmation_code),
        guest_profile:guest_profiles(id, name, email, phone, avatar_url, total_bookings, average_rating)
      `, { count: 'exact' })
      .eq('tenant_id', tenant.id)

    // Apply filters
    if (platform && platform !== 'all') {
      query = query.eq('source_provider', platform)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`guest_name.ilike.%${search}%,subject.ilike.%${search}%,last_message_preview.ilike.%${search}%`)
    }

    // Order by last message timestamp
    query = query
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    const { data: conversations, error, count } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform relations
    const transformedConversations = conversations?.map(conv => ({
      ...conv,
      property: Array.isArray(conv.property) ? conv.property[0] || null : conv.property,
      booking: Array.isArray(conv.booking) ? conv.booking[0] || null : conv.booking,
      guest_profile: Array.isArray(conv.guest_profile) ? conv.guest_profile[0] || null : conv.guest_profile,
    }))

    return NextResponse.json({
      conversations: transformedConversations,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'No tenant selected') {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
