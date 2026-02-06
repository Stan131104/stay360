import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { NextRequest, NextResponse } from 'next/server'

// OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const state = searchParams.get('state')
    const code = searchParams.get('code')
    const simulated = searchParams.get('simulated')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/onboarding/connect?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!provider || !state) {
      return NextResponse.redirect(
        new URL('/onboarding/connect?error=Invalid+callback', request.url)
      )
    }

    // Find the pending integration with this state
    const { data: integration, error: findError } = await supabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('provider', `${provider}_api`)
      .eq('status', 'pending')
      .single()

    if (findError || !integration) {
      console.error('Integration not found:', findError)
      return NextResponse.redirect(
        new URL('/onboarding/connect?error=Integration+not+found', request.url)
      )
    }

    // Verify state matches
    const storedState = (integration.config as Record<string, unknown>)?.oauth_state
    if (storedState !== state) {
      return NextResponse.redirect(
        new URL('/onboarding/connect?error=Invalid+state', request.url)
      )
    }

    // In a real implementation, we would:
    // 1. Exchange the code for access/refresh tokens
    // 2. Store the encrypted tokens
    // 3. Fetch initial data from the API

    // For the simulated flow, we just activate the integration
    if (simulated === 'true') {
      // Generate mock tokens for demo
      const mockTokens = {
        access_token: `${provider}_access_${Date.now()}`,
        refresh_token: `${provider}_refresh_${Date.now()}`,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      }

      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          status: 'active',
          config: {
            ...(integration.config as Record<string, unknown>),
            oauth_state: undefined, // Clear state
            simulated: true,
          },
          oauth_token: mockTokens.access_token,
          oauth_refresh_token: mockTokens.refresh_token,
          oauth_expires_at: mockTokens.expires_at,
        })
        .eq('id', integration.id)

      if (updateError) {
        console.error('Error activating integration:', updateError)
        return NextResponse.redirect(
          new URL('/onboarding/connect?error=Failed+to+activate', request.url)
        )
      }

      // Trigger initial sync
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sync/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ integrationId: integration.id }),
        })
      } catch (syncError) {
        console.warn('Initial sync failed:', syncError)
        // Continue even if sync fails
      }

      return NextResponse.redirect(
        new URL('/dashboard?connected=true', request.url)
      )
    }

    // Real OAuth flow would exchange code for tokens here
    // For now, redirect with error since we don't have real API credentials
    return NextResponse.redirect(
      new URL('/onboarding/connect?error=Real+OAuth+not+configured', request.url)
    )
  } catch (error) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/onboarding/connect?error=Callback+failed', request.url)
    )
  }
}
