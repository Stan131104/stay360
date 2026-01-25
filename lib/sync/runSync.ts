import { createClient } from '@/lib/supabase/server'
import { getProviderAdapter, type DateRange, type SyncResult } from '@/lib/integrations/providers'
import type {
  Integration,
  SyncRunInsert,
  SyncErrorInsert,
  PropertyInsert,
  BookingInsert,
  DailyRateInsert,
} from '@/lib/types/database'

interface RunSyncOptions {
  integrationId: string
  tenantId: string
  dateRange?: DateRange
}

interface RunSyncResult {
  success: boolean
  syncRunId: string
  stats: {
    propertiesSynced: number
    bookingsSynced: number
    ratesSynced: number
    errorsCount: number
  }
  error?: string
}

/**
 * Default sync date range: 6 months back, 12 months forward
 */
function getDefaultDateRange(): DateRange {
  const now = new Date()
  const start = new Date(now)
  start.setMonth(start.getMonth() - 6)

  const end = new Date(now)
  end.setMonth(end.getMonth() + 12)

  return { start, end }
}

/**
 * Run a full sync for an integration
 * 1. Creates sync_runs record
 * 2. Fetches data from provider
 * 3. Upserts properties, bookings, rates
 * 4. Logs errors to sync_errors
 * 5. Updates sync_runs with final status
 */
export async function runSync(options: RunSyncOptions): Promise<RunSyncResult> {
  const { integrationId, tenantId, dateRange = getDefaultDateRange() } = options
  const supabase = await createClient()

  let syncRunId: string = ''
  const stats = {
    propertiesSynced: 0,
    bookingsSynced: 0,
    ratesSynced: 0,
    errorsCount: 0,
  }

  try {
    // 1. Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('tenant_id', tenantId)
      .single()

    if (integrationError || !integration) {
      throw new Error(`Integration not found: ${integrationError?.message || 'Unknown error'}`)
    }

    // 2. Create sync run record
    const { data: syncRun, error: syncRunError } = await supabase
      .from('sync_runs')
      .insert({
        tenant_id: tenantId,
        integration_id: integrationId,
        status: 'running',
        started_at: new Date().toISOString(),
        properties_synced: 0,
        bookings_synced: 0,
        rates_synced: 0,
        errors_count: 0,
        summary: {},
      } satisfies SyncRunInsert)
      .select('id')
      .single()

    if (syncRunError || !syncRun) {
      throw new Error(`Failed to create sync run: ${syncRunError?.message}`)
    }

    syncRunId = syncRun.id

    // 3. Initialize provider adapter
    const adapter = getProviderAdapter(integration as Integration)
    await adapter.initialize(integration as Integration)

    // 4. Run sync
    const result: SyncResult = await adapter.sync(dateRange)

    // 5. Log any provider errors
    for (const error of result.errors) {
      await logSyncError(supabase, {
        tenant_id: tenantId,
        sync_run_id: syncRunId,
        error_type: error.type,
        error_message: error.message,
        error_details: error.details || {},
      })
      stats.errorsCount++
    }

    // 6. Upsert properties
    // Create a map of provider_id -> database property id for bookings
    const propertyIdMap = new Map<string, string>()

    for (const listing of result.listings) {
      try {
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .upsert(
            {
              tenant_id: tenantId,
              integration_id: integrationId,
              source_provider: integration.provider,
              provider_property_id: listing.provider_id,
              name: listing.name,
              address: listing.address,
              city: listing.city,
              country: listing.country,
              bedrooms: listing.bedrooms,
              bathrooms: listing.bathrooms,
              max_guests: listing.max_guests,
              metadata: listing.metadata || {},
            } satisfies PropertyInsert,
            {
              onConflict: 'tenant_id,source_provider,provider_property_id',
            }
          )
          .select('id')
          .single()

        if (propertyError) {
          await logSyncError(supabase, {
            tenant_id: tenantId,
            sync_run_id: syncRunId,
            error_type: 'property_upsert_error',
            error_message: propertyError.message,
            error_details: { listing_provider_id: listing.provider_id },
          })
          stats.errorsCount++
        } else if (property) {
          propertyIdMap.set(listing.provider_id, property.id)
          stats.propertiesSynced++
        }
      } catch {
        stats.errorsCount++
      }
    }

    // 7. Upsert bookings
    for (const booking of result.bookings) {
      try {
        const propertyId = propertyIdMap.get(booking.listing_provider_id)

        if (!propertyId) {
          await logSyncError(supabase, {
            tenant_id: tenantId,
            sync_run_id: syncRunId,
            error_type: 'booking_missing_property',
            error_message: `Property not found for booking: ${booking.provider_id}`,
            error_details: { listing_provider_id: booking.listing_provider_id },
          })
          stats.errorsCount++
          continue
        }

        const { error: bookingError } = await supabase
          .from('bookings')
          .upsert(
            {
              tenant_id: tenantId,
              property_id: propertyId,
              integration_id: integrationId,
              source_provider: integration.provider,
              provider_booking_id: booking.provider_id,
              status: booking.status,
              check_in: booking.check_in.toISOString().split('T')[0],
              check_out: booking.check_out.toISOString().split('T')[0],
              guest_name: booking.guest_name,
              guest_email: booking.guest_email,
              guest_phone: booking.guest_phone,
              num_guests: booking.num_guests,
              total_price: booking.total_price,
              currency: booking.currency || 'USD',
              notes: booking.notes,
              metadata: booking.metadata || {},
            } satisfies BookingInsert,
            {
              onConflict: 'tenant_id,source_provider,provider_booking_id',
            }
          )

        if (bookingError) {
          await logSyncError(supabase, {
            tenant_id: tenantId,
            sync_run_id: syncRunId,
            error_type: 'booking_upsert_error',
            error_message: bookingError.message,
            error_details: { booking_provider_id: booking.provider_id },
          })
          stats.errorsCount++
        } else {
          stats.bookingsSynced++
        }
      } catch {
        stats.errorsCount++
      }
    }

    // 8. Upsert rates
    for (const rate of result.rates) {
      try {
        const propertyId = propertyIdMap.get(rate.listing_provider_id)

        if (!propertyId) {
          continue // Skip rates for properties we don't have
        }

        const { error: rateError } = await supabase
          .from('daily_rates')
          .upsert(
            {
              tenant_id: tenantId,
              property_id: propertyId,
              integration_id: integrationId,
              source_provider: integration.provider,
              date: rate.date.toISOString().split('T')[0],
              price: rate.price,
              min_nights: rate.min_nights || 1,
              currency: rate.currency || 'USD',
              metadata: rate.metadata || {},
            } satisfies DailyRateInsert,
            {
              onConflict: 'tenant_id,property_id,date,source_provider',
            }
          )

        if (rateError) {
          stats.errorsCount++
        } else {
          stats.ratesSynced++
        }
      } catch {
        stats.errorsCount++
      }
    }

    // 9. Update sync run as completed
    await supabase
      .from('sync_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        properties_synced: stats.propertiesSynced,
        bookings_synced: stats.bookingsSynced,
        rates_synced: stats.ratesSynced,
        errors_count: stats.errorsCount,
        summary: {
          date_range: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          },
        },
      })
      .eq('id', syncRunId)

    // 10. Update integration status
    await supabase
      .from('integrations')
      .update({
        status: stats.errorsCount > 0 ? 'error' : 'active',
        last_sync_at: new Date().toISOString(),
        last_error: stats.errorsCount > 0 ? `${stats.errorsCount} errors during sync` : null,
      })
      .eq('id', integrationId)

    return {
      success: true,
      syncRunId,
      stats,
    }
  } catch (error) {
    // Mark sync as failed if we have a sync run ID
    if (syncRunId) {
      const supabaseForError = await createClient()
      await supabaseForError
        .from('sync_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors_count: stats.errorsCount + 1,
          summary: { fatal_error: error instanceof Error ? error.message : 'Unknown error' },
        })
        .eq('id', syncRunId)

      // Update integration status
      await supabaseForError
        .from('integrations')
        .update({
          status: 'error',
          last_error: error instanceof Error ? error.message : 'Sync failed',
        })
        .eq('id', integrationId)
    }

    return {
      success: false,
      syncRunId,
      stats,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Helper to log sync errors
 */
async function logSyncError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  error: SyncErrorInsert
): Promise<void> {
  try {
    await supabase.from('sync_errors').insert(error)
  } catch (e) {
    console.error('Failed to log sync error:', e)
  }
}
