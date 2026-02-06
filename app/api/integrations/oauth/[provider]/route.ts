import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Initiate OAuth flow for a provider
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()
    const { provider } = await params
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Integration name is required' },
        { status: 400 }
      )
    }

    // Generate state for OAuth security
    const state = crypto.randomBytes(32).toString('hex')

    // Store the pending OAuth state
    const { error: stateError } = await supabase
      .from('integrations')
      .insert({
        tenant_id: tenant.id,
        name,
        provider: `${provider}_api`,
        status: 'pending',
        config: {
          oauth_state: state,
          oauth_started_at: new Date().toISOString(),
        },
      })

    if (stateError) {
      console.error('Error storing OAuth state:', stateError)
      return NextResponse.json(
        { error: 'Failed to initiate OAuth' },
        { status: 500 }
      )
    }

    // In a real implementation, these would be actual OAuth URLs
    // For now, we simulate the OAuth flow
    const oauthUrls: Record<string, string> = {
      airbnb: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/oauth/callback?provider=airbnb&state=${state}&simulated=true`,
      booking: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/oauth/callback?provider=booking&state=${state}&simulated=true`,
    }

    const redirectUrl = oauthUrls[provider]

    if (!redirectUrl) {
      return NextResponse.json(
        { error: 'Unknown provider' },
        { status: 400 }
      )
    }

    return NextResponse.json({ redirectUrl, state })
  } catch (error) {
    console.error('Error in OAuth initiation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
