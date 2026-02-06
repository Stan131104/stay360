import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'

export async function GET() {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()

    // Get sum of unread counts from all active conversations
    const { data, error } = await supabase
      .from('conversations')
      .select('unread_count')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const totalUnread = data?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0

    return NextResponse.json({ unread_count: totalUnread })
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
