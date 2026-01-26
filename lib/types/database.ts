// Database types for Stay360 multi-tenant schema
// These types mirror the Postgres schema

export type TenantRole = 'OWNER' | 'MANAGER' | 'FINANCE' | 'READ_ONLY'

export type IntegrationProvider =
  | 'airbnb_ical'
  | 'vrbo_ical'
  | 'booking_ical'
  | 'generic_ical'
  | 'channel_manager_guesty'
  | 'channel_manager_hostaway'
  | 'channel_manager_mock'

export type IntegrationStatus = 'pending' | 'active' | 'error' | 'disabled'

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'blocked'

export type SyncStatus = 'running' | 'completed' | 'failed'

// Table row types
export interface Tenant {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface TenantMembership {
  id: string
  tenant_id: string
  user_id: string
  role: TenantRole
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  tenant_id: string
  name: string
  provider: IntegrationProvider
  status: IntegrationStatus
  config: IntegrationConfig
  credentials_encrypted?: string | null
  last_sync_at?: string | null
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface IntegrationConfig {
  // iCal specific
  ical_urls?: string[]
  property_names?: (string | undefined)[]
  // Channel manager specific
  api_endpoint?: string
  account_id?: string
  // Generic settings
  sync_interval_minutes?: number
  [key: string]: unknown
}

export interface Property {
  id: string
  tenant_id: string
  integration_id?: string | null
  source_provider?: IntegrationProvider | null
  provider_property_id?: string | null
  name: string
  address?: string | null
  city?: string | null
  country?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  max_guests?: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  tenant_id: string
  property_id: string
  integration_id?: string | null
  source_provider?: IntegrationProvider | null
  provider_booking_id?: string | null
  status: BookingStatus
  check_in: string
  check_out: string
  guest_name?: string | null
  guest_email?: string | null
  guest_phone?: string | null
  num_guests?: number | null
  total_price?: number | null
  currency: string
  notes?: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DailyRate {
  id: string
  tenant_id: string
  property_id: string
  integration_id?: string | null
  source_provider?: IntegrationProvider | null
  date: string
  price: number
  min_nights: number
  currency: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SyncRun {
  id: string
  tenant_id: string
  integration_id: string
  status: SyncStatus
  started_at: string
  completed_at?: string | null
  properties_synced: number
  bookings_synced: number
  rates_synced: number
  errors_count: number
  summary: Record<string, unknown>
}

export interface SyncError {
  id: string
  tenant_id: string
  sync_run_id: string
  error_type: string
  error_message: string
  error_details: Record<string, unknown>
  created_at: string
}

// Extended types with relations
export interface TenantWithRole extends Tenant {
  role: TenantRole
}

export interface IntegrationWithStats extends Integration {
  properties_count?: number
  bookings_count?: number
  last_sync_run?: SyncRun | null
}

export interface PropertyWithBookings extends Property {
  bookings?: Booking[]
  upcoming_bookings_count?: number
}

export interface BookingWithProperty extends Booking {
  property?: Property
}

// Insert types (omit auto-generated fields)
export type TenantInsert = Omit<Tenant, 'id' | 'created_at' | 'updated_at'>
export type TenantMembershipInsert = Omit<TenantMembership, 'id' | 'created_at' | 'updated_at'>
export type IntegrationInsert = Omit<Integration, 'id' | 'created_at' | 'updated_at'>
export type PropertyInsert = Omit<Property, 'id' | 'created_at' | 'updated_at'>
export type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at'>
export type DailyRateInsert = Omit<DailyRate, 'id' | 'created_at' | 'updated_at'>
export type SyncRunInsert = Omit<SyncRun, 'id'>
export type SyncErrorInsert = Omit<SyncError, 'id' | 'created_at'>
