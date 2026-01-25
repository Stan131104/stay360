/**
 * Scheduled Sync Edge Function
 *
 * This edge function runs on a cron schedule to sync all active integrations.
 * Deploy with: supabase functions deploy scheduled-sync
 *
 * Set up cron in Supabase Dashboard > Database > Extensions > pg_cron:
 *
 * SELECT cron.schedule(
 *   'sync-all-integrations',
 *   '0 * * * *',  -- Every hour
 *   $$
 *   SELECT net.http_post(
 *     url := 'https://<project-ref>.supabase.co/functions/v1/scheduled-sync',
 *     headers := jsonb_build_object(
 *       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
 *       'Content-Type', 'application/json'
 *     ),
 *     body := '{}'
 *   );
 *   $$
 * );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Integration {
  id: string
  tenant_id: string
  provider: string
  status: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active integrations that need syncing
    const { data: integrations, error: fetchError } = await supabase
      .from('integrations')
      .select('id, tenant_id, provider, status')
      .in('status', ['active', 'pending'])

    if (fetchError) {
      throw new Error(`Failed to fetch integrations: ${fetchError.message}`)
    }

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No integrations to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each integration
    // Note: In production, you'd want to parallelize this or use a queue
    const results: Array<{ integrationId: string; success: boolean; error?: string }> = []

    for (const integration of integrations as Integration[]) {
      try {
        // Call the sync API endpoint
        // In a real implementation, you'd call the sync logic directly here
        // to avoid HTTP overhead, but this demonstrates the pattern
        console.log(`Syncing integration ${integration.id} for tenant ${integration.tenant_id}`)

        // For now, just mark that we attempted sync
        results.push({
          integrationId: integration.id,
          success: true,
        })
      } catch (err) {
        results.push({
          integrationId: integration.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${integrations.length} integrations`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Scheduled sync error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
