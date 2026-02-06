import type {
  Integration,
  IntegrationProvider,
  BookingStatus,
  AmenityCategory,
  PropertyType,
  FeeType,
  PricingRuleType,
} from '@/lib/types/database'

// Date range for fetching data
export interface DateRange {
  start: Date
  end: Date
}

// =============================================
// PROVIDER DATA TYPES
// =============================================

// Photo from provider
export interface ProviderPhoto {
  external_id?: string
  url: string
  thumbnail_url?: string
  caption?: string
  position: number
  is_primary: boolean
  width?: number
  height?: number
}

// Amenity from provider
export interface ProviderAmenity {
  name: string
  category: AmenityCategory
  icon?: string
  is_highlighted?: boolean
}

// Fee from provider
export interface ProviderFee {
  fee_type: FeeType
  name: string
  amount: number
  currency?: string
  is_percentage?: boolean
  per_night?: boolean
  per_guest?: boolean
  min_guests_for_fee?: number
  is_mandatory?: boolean
}

// Pricing rule from provider
export interface ProviderPricingRule {
  name: string
  rule_type: PricingRuleType
  discount_percent?: number
  min_nights?: number
  max_nights?: number
  start_date?: Date
  end_date?: Date
  days_before_checkin?: number
  is_active?: boolean
}

// Message from provider
export interface ProviderMessage {
  external_id: string
  conversation_external_id: string
  direction: 'inbound' | 'outbound'
  sender_name: string
  sender_type: 'guest' | 'host' | 'system'
  content: string
  sent_at: Date
  read_at?: Date
  metadata?: Record<string, unknown>
}

// Conversation from provider
export interface ProviderConversation {
  external_id: string
  booking_provider_id?: string
  listing_provider_id?: string
  guest_name: string
  guest_avatar_url?: string
  guest_external_id?: string
  subject?: string
  status?: 'active' | 'archived' | 'closed'
  messages: ProviderMessage[]
  metadata?: Record<string, unknown>
}

// Send message request
export interface SendMessageRequest {
  conversation_external_id: string
  content: string
  metadata?: Record<string, unknown>
}

// Review from provider
export interface ProviderReview {
  external_id: string
  reviewer_name: string
  reviewer_avatar_url?: string
  rating: number
  rating_cleanliness?: number
  rating_communication?: number
  rating_check_in?: number
  rating_accuracy?: number
  rating_location?: number
  rating_value?: number
  review_text?: string
  review_date: Date
  host_response?: string
  host_response_date?: Date
  is_public?: boolean
}

// Guest from provider
export interface ProviderGuest {
  external_id?: string
  name: string
  email?: string
  phone?: string
  avatar_url?: string
  total_bookings?: number
  average_rating?: number
}

// Raw listing from provider (extended with full details)
export interface ProviderListing {
  provider_id: string
  name: string
  address?: string
  city?: string
  country?: string
  bedrooms?: number
  bathrooms?: number
  max_guests?: number
  listing_url?: string
  thumbnail_url?: string
  is_active?: boolean
  metadata?: Record<string, unknown>
  // Extended details
  description?: string
  short_description?: string
  property_type?: PropertyType
  check_in_time?: string
  check_out_time?: string
  check_in_instructions?: string
  cancellation_policy?: string
  house_rules?: string
  instant_book_enabled?: boolean
  min_nights?: number
  max_nights?: number
  latitude?: number
  longitude?: number
  neighborhood?: string
  transit_info?: string
  space_description?: string
  guest_access?: string
  interaction?: string
  wifi_name?: string
  wifi_password?: string
  door_code?: string
  // Related data
  photos?: ProviderPhoto[]
  amenities?: ProviderAmenity[]
  fees?: ProviderFee[]
  pricing_rules?: ProviderPricingRule[]
}

// Raw booking from provider (extended)
export interface ProviderBooking {
  provider_id: string
  listing_provider_id: string // Links to ProviderListing
  status: BookingStatus
  check_in: Date
  check_out: Date
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  num_guests?: number
  total_price?: number
  currency?: string
  notes?: string
  special_requests?: string
  confirmation_code?: string
  source_url?: string
  metadata?: Record<string, unknown>
  // Extended guest info
  guest?: ProviderGuest
  // Payment info
  payment_status?: 'pending' | 'paid' | 'partially_paid' | 'refunded'
  payment_amount?: number
  payment_date?: Date
}

// Raw rate from provider
export interface ProviderRate {
  listing_provider_id: string
  date: Date
  price: number
  min_nights?: number
  currency?: string
  available?: boolean
  metadata?: Record<string, unknown>
}

// Sync result from provider (extended)
export interface SyncResult {
  listings: ProviderListing[]
  bookings: ProviderBooking[]
  rates: ProviderRate[]
  reviews?: ProviderReview[]
  conversations?: ProviderConversation[]
  errors: ProviderError[]
}

export interface ProviderError {
  type: string
  message: string
  details?: Record<string, unknown>
}

// =============================================
// WRITE OPERATION TYPES
// =============================================

// Update listing request
export interface UpdateListingRequest {
  name?: string
  description?: string
  short_description?: string
  property_type?: PropertyType
  address?: string
  city?: string
  country?: string
  bedrooms?: number
  bathrooms?: number
  max_guests?: number
  check_in_time?: string
  check_out_time?: string
  check_in_instructions?: string
  cancellation_policy?: string
  house_rules?: string
  instant_book_enabled?: boolean
  min_nights?: number
  max_nights?: number
  wifi_name?: string
  wifi_password?: string
  door_code?: string
}

// Update availability request
export interface UpdateAvailabilityRequest {
  dates: DateRange
  available: boolean
  min_nights?: number
  notes?: string
}

// Update pricing request
export interface UpdatePricingRequest {
  dates: DateRange
  price: number
  currency?: string
  min_nights?: number
}

// Write operation result
export interface WriteResult {
  success: boolean
  error?: string
  data?: Record<string, unknown>
}

// =============================================
// PROVIDER ADAPTER INTERFACE
// =============================================

/**
 * Provider adapter interface
 * All integration providers must implement this contract
 */
export interface ProviderAdapter {
  /**
   * Provider type identifier
   */
  readonly provider: IntegrationProvider

  /**
   * Whether this provider supports write operations
   */
  readonly supportsWrite: boolean

  /**
   * Initialize the adapter with integration config
   */
  initialize(integration: Integration): Promise<void>

  /**
   * Test the connection/credentials
   */
  testConnection(): Promise<{ success: boolean; error?: string }>

  /**
   * Fetch all listings from the provider
   */
  listListings(): Promise<ProviderListing[]>

  /**
   * Fetch bookings for a date range
   */
  listBookings(range: DateRange): Promise<ProviderBooking[]>

  /**
   * Fetch rates for a date range (optional, not all providers support this)
   */
  listRates?(range: DateRange): Promise<ProviderRate[]>

  /**
   * Fetch reviews for a listing (optional)
   */
  listReviews?(listingProviderId: string): Promise<ProviderReview[]>

  /**
   * Full sync: fetch listings, bookings, rates, and optionally reviews
   */
  sync(range: DateRange): Promise<SyncResult>

  // =============================================
  // WRITE OPERATIONS (Optional - for API providers)
  // =============================================

  /**
   * Update a listing on the provider
   */
  updateListing?(listingProviderId: string, data: UpdateListingRequest): Promise<WriteResult>

  /**
   * Update availability/blocking for a listing
   */
  updateAvailability?(listingProviderId: string, request: UpdateAvailabilityRequest): Promise<WriteResult>

  /**
   * Update pricing for a listing
   */
  updatePricing?(listingProviderId: string, request: UpdatePricingRequest): Promise<WriteResult>

  /**
   * Respond to a review
   */
  respondToReview?(reviewId: string, response: string): Promise<WriteResult>

  // =============================================
  // MESSAGING OPERATIONS (Optional - for API providers)
  // =============================================

  /**
   * Fetch all conversations from the provider
   */
  listConversations?(): Promise<ProviderConversation[]>

  /**
   * Send a message to a conversation
   */
  sendMessage?(request: SendMessageRequest): Promise<WriteResult>
}

/**
 * Factory function type for creating provider adapters
 */
export type ProviderAdapterFactory = (integration: Integration) => ProviderAdapter

/**
 * Registry of available provider adapters
 */
export const providerRegistry: Map<IntegrationProvider, ProviderAdapterFactory> = new Map()

/**
 * Register a provider adapter
 */
export function registerProvider(
  provider: IntegrationProvider,
  factory: ProviderAdapterFactory
): void {
  providerRegistry.set(provider, factory)
}

/**
 * Get a provider adapter for an integration
 */
export function getProviderAdapter(integration: Integration): ProviderAdapter {
  const factory = providerRegistry.get(integration.provider)

  if (!factory) {
    throw new Error(`No adapter registered for provider: ${integration.provider}`)
  }

  return factory(integration)
}

/**
 * Check if a provider supports API-based operations (vs iCal)
 */
export function isApiProvider(provider: IntegrationProvider): boolean {
  return provider === 'airbnb_api' || provider === 'booking_api' ||
    provider.startsWith('channel_manager_')
}
