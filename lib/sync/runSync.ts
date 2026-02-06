import { createClient } from '@/lib/supabase/server'
import {
  getProviderAdapter,
  isApiProvider,
  type DateRange,
  type SyncResult,
  type ProviderListing,
  type ProviderBooking,
  type ProviderReview,
  type ProviderConversation,
  type ProviderMessage,
} from '@/lib/integrations/providers'
import type {
  Integration,
  SyncRunInsert,
  SyncErrorInsert,
  PropertyInsert,
  BookingInsert,
  DailyRateInsert,
  PropertyDetailsInsert,
  PropertyPhotoInsert,
  PropertyAmenityInsert,
  PropertyFeeInsert,
  PricingRuleInsert,
  GuestProfileInsert,
  GuestReviewInsert,
  BookingPaymentInsert,
  ConversationInsert,
  MessageInsert,
} from '@/lib/types/database'

interface RunSyncOptions {
  integrationId: string
  tenantId: string
  dateRange?: DateRange
  syncExtendedData?: boolean // Whether to sync photos, amenities, reviews, etc.
}

interface RunSyncResult {
  success: boolean
  syncRunId: string
  stats: {
    propertiesSynced: number
    bookingsSynced: number
    ratesSynced: number
    photosSynced: number
    amenitiesSynced: number
    reviewsSynced: number
    conversationsSynced: number
    messagesSynced: number
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
 * 3. Upserts properties (with extended data for API providers)
 * 4. Upserts bookings (with guest profiles for API providers)
 * 5. Upserts rates
 * 6. Syncs photos, amenities, fees, reviews (for API providers)
 * 7. Logs errors to sync_errors
 * 8. Updates sync_runs with final status
 */
export async function runSync(options: RunSyncOptions): Promise<RunSyncResult> {
  const {
    integrationId,
    tenantId,
    dateRange = getDefaultDateRange(),
    syncExtendedData = true,
  } = options

  const supabase = await createClient()

  let syncRunId: string = ''
  const stats = {
    propertiesSynced: 0,
    bookingsSynced: 0,
    ratesSynced: 0,
    photosSynced: 0,
    amenitiesSynced: 0,
    reviewsSynced: 0,
    conversationsSynced: 0,
    messagesSynced: 0,
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

    const isApi = isApiProvider(integration.provider)

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

    // 6. Upsert properties with extended data
    const propertyIdMap = new Map<string, string>()

    for (const listing of result.listings) {
      try {
        const propertyId = await syncProperty(
          supabase,
          tenantId,
          integrationId,
          integration,
          listing,
          syncRunId,
          stats
        )

        if (propertyId) {
          propertyIdMap.set(listing.provider_id, propertyId)

          // Sync extended data for API providers
          if (isApi && syncExtendedData) {
            await syncPropertyExtendedData(
              supabase,
              tenantId,
              propertyId,
              integration,
              listing,
              stats
            )
          }
        }
      } catch {
        stats.errorsCount++
      }
    }

    // 7. Process guest profiles from bookings (for API providers)
    const guestProfileIdMap = new Map<string, string>()
    if (isApi && syncExtendedData) {
      for (const booking of result.bookings) {
        if (booking.guest?.external_id) {
          try {
            const guestProfileId = await syncGuestProfile(
              supabase,
              tenantId,
              integration,
              booking
            )
            if (guestProfileId) {
              guestProfileIdMap.set(booking.guest.external_id, guestProfileId)
            }
          } catch {
            // Non-critical
          }
        }
      }
    }

    // 8. Upsert bookings with extended data
    for (const booking of result.bookings) {
      try {
        await syncBooking(
          supabase,
          tenantId,
          integrationId,
          integration,
          booking,
          propertyIdMap,
          guestProfileIdMap,
          syncRunId,
          stats
        )
      } catch {
        stats.errorsCount++
      }
    }

    // 9. Upsert rates
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

    // 10. Sync reviews (for API providers)
    if (isApi && syncExtendedData && result.reviews) {
      for (const review of result.reviews) {
        try {
          await syncReview(
            supabase,
            tenantId,
            integration,
            review,
            propertyIdMap,
            stats
          )
        } catch {
          // Non-critical
        }
      }
    }

    // 11. Sync conversations and messages (for API providers)
    if (isApi && syncExtendedData && result.conversations) {
      // Build booking ID map for linking conversations to bookings
      const bookingIdMap = new Map<string, string>()
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, provider_booking_id')
        .eq('tenant_id', tenantId)
        .not('provider_booking_id', 'is', null)

      if (bookings) {
        for (const booking of bookings) {
          if (booking.provider_booking_id) {
            bookingIdMap.set(booking.provider_booking_id, booking.id)
          }
        }
      }

      for (const conversation of result.conversations) {
        try {
          await syncConversation(
            supabase,
            tenantId,
            integrationId,
            integration,
            conversation,
            propertyIdMap,
            bookingIdMap,
            guestProfileIdMap,
            stats
          )
        } catch {
          // Non-critical
        }
      }
    }

    // 12. Update sync run as completed
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
          photos_synced: stats.photosSynced,
          amenities_synced: stats.amenitiesSynced,
          reviews_synced: stats.reviewsSynced,
          conversations_synced: stats.conversationsSynced,
          messages_synced: stats.messagesSynced,
          is_api_provider: isApi,
        },
      })
      .eq('id', syncRunId)

    // 12. Update integration status
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
 * Sync a property with basic and extended data
 */
async function syncProperty(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  integrationId: string,
  integration: Integration,
  listing: ProviderListing,
  syncRunId: string,
  stats: RunSyncResult['stats']
): Promise<string | null> {
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
        listing_url: listing.listing_url,
        thumbnail_url: listing.thumbnail_url,
        is_active: listing.is_active ?? true,
        sync_status: 'synced',
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
    return null
  }

  stats.propertiesSynced++
  return property?.id || null
}

/**
 * Sync extended property data (details, photos, amenities, fees, pricing rules)
 */
async function syncPropertyExtendedData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  propertyId: string,
  integration: Integration,
  listing: ProviderListing,
  stats: RunSyncResult['stats']
): Promise<void> {
  // Sync property details
  if (listing.description || listing.property_type || listing.check_in_time) {
    await supabase
      .from('property_details')
      .upsert(
        {
          tenant_id: tenantId,
          property_id: propertyId,
          description: listing.description,
          short_description: listing.short_description,
          property_type: listing.property_type,
          check_in_time: listing.check_in_time,
          check_out_time: listing.check_out_time,
          check_in_instructions: listing.check_in_instructions,
          cancellation_policy: listing.cancellation_policy,
          house_rules: listing.house_rules,
          instant_book_enabled: listing.instant_book_enabled ?? false,
          min_nights: listing.min_nights ?? 1,
          max_nights: listing.max_nights,
          latitude: listing.latitude,
          longitude: listing.longitude,
          neighborhood: listing.neighborhood,
          transit_info: listing.transit_info,
          space_description: listing.space_description,
          guest_access: listing.guest_access,
          interaction: listing.interaction,
          wifi_name: listing.wifi_name,
          wifi_password: listing.wifi_password,
          door_code: listing.door_code,
        } satisfies PropertyDetailsInsert,
        {
          onConflict: 'property_id',
        }
      )
  }

  // Sync photos
  if (listing.photos && listing.photos.length > 0) {
    for (const photo of listing.photos) {
      const { error } = await supabase
        .from('property_photos')
        .upsert(
          {
            tenant_id: tenantId,
            property_id: propertyId,
            url: photo.url,
            thumbnail_url: photo.thumbnail_url,
            caption: photo.caption,
            position: photo.position,
            is_primary: photo.is_primary,
            source_provider: integration.provider,
            external_id: photo.external_id,
            width: photo.width,
            height: photo.height,
          } satisfies PropertyPhotoInsert,
          {
            onConflict: 'property_id,url',
            ignoreDuplicates: true,
          }
        )

      if (!error) {
        stats.photosSynced++
      }
    }
  }

  // Sync amenities
  if (listing.amenities && listing.amenities.length > 0) {
    for (const amenity of listing.amenities) {
      const { error } = await supabase
        .from('property_amenities')
        .upsert(
          {
            tenant_id: tenantId,
            property_id: propertyId,
            name: amenity.name,
            category: amenity.category,
            icon: amenity.icon,
            source_provider: integration.provider,
            is_highlighted: amenity.is_highlighted ?? false,
          } satisfies PropertyAmenityInsert,
          {
            onConflict: 'property_id,name',
          }
        )

      if (!error) {
        stats.amenitiesSynced++
      }
    }
  }

  // Sync fees
  if (listing.fees && listing.fees.length > 0) {
    for (const fee of listing.fees) {
      await supabase
        .from('property_fees')
        .upsert(
          {
            tenant_id: tenantId,
            property_id: propertyId,
            fee_type: fee.fee_type,
            name: fee.name,
            amount: fee.amount,
            currency: fee.currency || 'USD',
            is_percentage: fee.is_percentage ?? false,
            per_night: fee.per_night ?? false,
            per_guest: fee.per_guest ?? false,
            min_guests_for_fee: fee.min_guests_for_fee,
            is_mandatory: fee.is_mandatory ?? true,
            source_provider: integration.provider,
          } satisfies PropertyFeeInsert,
          {
            onConflict: 'property_id,fee_type,name',
            ignoreDuplicates: true,
          }
        )
    }
  }

  // Sync pricing rules
  if (listing.pricing_rules && listing.pricing_rules.length > 0) {
    for (const rule of listing.pricing_rules) {
      await supabase
        .from('pricing_rules')
        .upsert(
          {
            tenant_id: tenantId,
            property_id: propertyId,
            name: rule.name,
            rule_type: rule.rule_type,
            discount_percent: rule.discount_percent,
            min_nights: rule.min_nights,
            max_nights: rule.max_nights,
            start_date: rule.start_date?.toISOString().split('T')[0],
            end_date: rule.end_date?.toISOString().split('T')[0],
            days_before_checkin: rule.days_before_checkin,
            is_active: rule.is_active ?? true,
            source_provider: integration.provider,
          } satisfies PricingRuleInsert,
          {
            onConflict: 'property_id,name,rule_type',
            ignoreDuplicates: true,
          }
        )
    }
  }
}

/**
 * Sync guest profile from booking data
 */
async function syncGuestProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  integration: Integration,
  booking: ProviderBooking
): Promise<string | null> {
  if (!booking.guest) return null

  const { data: profile, error } = await supabase
    .from('guest_profiles')
    .upsert(
      {
        tenant_id: tenantId,
        name: booking.guest.name,
        email: booking.guest.email,
        phone: booking.guest.phone,
        avatar_url: booking.guest.avatar_url,
        source_provider: integration.provider,
        external_id: booking.guest.external_id,
        total_bookings: booking.guest.total_bookings ?? 0,
        average_rating: booking.guest.average_rating,
        metadata: {},
      } satisfies GuestProfileInsert,
      {
        onConflict: 'tenant_id,source_provider,external_id',
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single()

  return error ? null : profile?.id || null
}

/**
 * Sync a booking with extended data
 */
async function syncBooking(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  integrationId: string,
  integration: Integration,
  booking: ProviderBooking,
  propertyIdMap: Map<string, string>,
  guestProfileIdMap: Map<string, string>,
  syncRunId: string,
  stats: RunSyncResult['stats']
): Promise<void> {
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
    return
  }

  // Get guest profile ID if available
  const guestProfileId = booking.guest?.external_id
    ? guestProfileIdMap.get(booking.guest.external_id)
    : undefined

  const { data: savedBooking, error: bookingError } = await supabase
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
        guest_profile_id: guestProfileId,
        num_guests: booking.num_guests,
        total_price: booking.total_price,
        currency: booking.currency || 'USD',
        notes: booking.notes,
        special_requests: booking.special_requests,
        confirmation_code: booking.confirmation_code,
        source_url: booking.source_url,
        metadata: booking.metadata || {},
      } satisfies BookingInsert,
      {
        onConflict: 'tenant_id,source_provider,provider_booking_id',
      }
    )
    .select('id')
    .single()

  if (bookingError) {
    await logSyncError(supabase, {
      tenant_id: tenantId,
      sync_run_id: syncRunId,
      error_type: 'booking_upsert_error',
      error_message: bookingError.message,
      error_details: { booking_provider_id: booking.provider_id },
    })
    stats.errorsCount++
    return
  }

  stats.bookingsSynced++

  // Sync payment data if available
  if (savedBooking && booking.payment_status && booking.payment_amount) {
    await supabase
      .from('booking_payments')
      .upsert(
        {
          tenant_id: tenantId,
          booking_id: savedBooking.id,
          status: booking.payment_status === 'paid' ? 'paid' :
                  booking.payment_status === 'partially_paid' ? 'partially_paid' :
                  booking.payment_status === 'refunded' ? 'refunded' : 'pending',
          amount: booking.payment_amount,
          currency: booking.currency || 'USD',
          payment_date: booking.payment_date?.toISOString(),
          source_provider: integration.provider,
          metadata: {},
        } satisfies BookingPaymentInsert,
        {
          onConflict: 'booking_id,source_provider',
          ignoreDuplicates: true,
        }
      )
  }
}

/**
 * Sync a review
 */
async function syncReview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  integration: Integration,
  review: ProviderReview,
  propertyIdMap: Map<string, string>,
  stats: RunSyncResult['stats']
): Promise<void> {
  // Find the property ID - we need to match reviews to properties
  // For now, we'll need to determine the property from context
  // This is a simplification - in practice, reviews come with listing IDs

  // Get the first property ID as a fallback (in real implementation, reviews would have listing IDs)
  const propertyId = Array.from(propertyIdMap.values())[0]
  if (!propertyId) return

  const { error } = await supabase
    .from('guest_reviews')
    .upsert(
      {
        tenant_id: tenantId,
        property_id: propertyId,
        reviewer_name: review.reviewer_name,
        reviewer_avatar_url: review.reviewer_avatar_url,
        rating: review.rating,
        rating_cleanliness: review.rating_cleanliness,
        rating_communication: review.rating_communication,
        rating_check_in: review.rating_check_in,
        rating_accuracy: review.rating_accuracy,
        rating_location: review.rating_location,
        rating_value: review.rating_value,
        review_text: review.review_text,
        review_date: review.review_date.toISOString().split('T')[0],
        host_response: review.host_response,
        host_response_date: review.host_response_date?.toISOString().split('T')[0],
        source_provider: integration.provider,
        external_id: review.external_id,
        is_public: review.is_public ?? true,
      } satisfies GuestReviewInsert,
      {
        onConflict: 'tenant_id,source_provider,external_id',
        ignoreDuplicates: true,
      }
    )

  if (!error) {
    stats.reviewsSynced++
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

/**
 * Sync a conversation with its messages
 */
async function syncConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  integrationId: string,
  integration: Integration,
  conversation: ProviderConversation,
  propertyIdMap: Map<string, string>,
  bookingIdMap: Map<string, string>,
  guestProfileIdMap: Map<string, string>,
  stats: RunSyncResult['stats']
): Promise<void> {
  // Resolve property ID
  const propertyId = conversation.listing_provider_id
    ? propertyIdMap.get(conversation.listing_provider_id)
    : undefined

  // Resolve booking ID
  const bookingId = conversation.booking_provider_id
    ? bookingIdMap.get(conversation.booking_provider_id)
    : undefined

  // Resolve guest profile ID
  const guestProfileId = conversation.guest_external_id
    ? guestProfileIdMap.get(conversation.guest_external_id)
    : undefined

  // Calculate unread count (messages without read_at that are inbound)
  const unreadCount = conversation.messages.filter(
    m => m.direction === 'inbound' && !m.read_at
  ).length

  // Get last message for preview
  const sortedMessages = [...conversation.messages].sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  )
  const lastMessage = sortedMessages[0]

  // Upsert conversation
  const { data: savedConversation, error: convError } = await supabase
    .from('conversations')
    .upsert(
      {
        tenant_id: tenantId,
        booking_id: bookingId,
        property_id: propertyId,
        integration_id: integrationId,
        source_provider: integration.provider,
        external_id: conversation.external_id,
        guest_name: conversation.guest_name,
        guest_avatar_url: conversation.guest_avatar_url,
        guest_profile_id: guestProfileId,
        subject: conversation.subject,
        status: conversation.status || 'active',
        last_message_at: lastMessage?.sent_at.toISOString(),
        last_message_preview: lastMessage?.content.substring(0, 100),
        unread_count: unreadCount,
        metadata: conversation.metadata || {},
      } satisfies ConversationInsert,
      {
        onConflict: 'tenant_id,source_provider,external_id',
      }
    )
    .select('id')
    .single()

  if (convError || !savedConversation) {
    return
  }

  stats.conversationsSynced++

  // Sync messages
  for (const message of conversation.messages) {
    await syncMessage(
      supabase,
      tenantId,
      savedConversation.id,
      integration,
      message,
      stats
    )
  }
}

/**
 * Sync a single message
 */
async function syncMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  conversationId: string,
  integration: Integration,
  message: ProviderMessage,
  stats: RunSyncResult['stats']
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .upsert(
      {
        tenant_id: tenantId,
        conversation_id: conversationId,
        source_provider: integration.provider,
        external_id: message.external_id,
        direction: message.direction,
        sender_name: message.sender_name,
        sender_type: message.sender_type,
        content: message.content,
        sent_at: message.sent_at.toISOString(),
        read_at: message.read_at?.toISOString(),
        delivered_to_provider: message.direction === 'outbound',
        metadata: message.metadata || {},
      } satisfies MessageInsert,
      {
        onConflict: 'tenant_id,source_provider,external_id',
      }
    )

  if (!error) {
    stats.messagesSynced++
  }
}
