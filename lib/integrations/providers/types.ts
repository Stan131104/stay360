import type {
  Integration,
  Property,
  Booking,
  DailyRate,
  IntegrationProvider,
  BookingStatus,
} from '@/lib/types/database'

// Date range for fetching data
export interface DateRange {
  start: Date
  end: Date
}

// Raw listing from provider (before mapping to Property)
export interface ProviderListing {
  provider_id: string
  name: string
  address?: string
  city?: string
  country?: string
  bedrooms?: number
  bathrooms?: number
  max_guests?: number
  metadata?: Record<string, unknown>
}

// Raw booking from provider (before mapping to Booking)
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
  metadata?: Record<string, unknown>
}

// Raw rate from provider
export interface ProviderRate {
  listing_provider_id: string
  date: Date
  price: number
  min_nights?: number
  currency?: string
  metadata?: Record<string, unknown>
}

// Sync result from provider
export interface SyncResult {
  listings: ProviderListing[]
  bookings: ProviderBooking[]
  rates: ProviderRate[]
  errors: ProviderError[]
}

export interface ProviderError {
  type: string
  message: string
  details?: Record<string, unknown>
}

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
   * Full sync: fetch listings, bookings, and rates
   */
  sync(range: DateRange): Promise<SyncResult>
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
