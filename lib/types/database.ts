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
  | 'airbnb_api'
  | 'booking_api'

export type IntegrationStatus = 'pending' | 'active' | 'error' | 'disabled'

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'blocked'

export type SyncStatus = 'running' | 'completed' | 'failed'

export type PropertySyncStatus = 'synced' | 'pending' | 'error' | 'never_synced'

export type FeeType = 'cleaning' | 'service' | 'pet' | 'extra_guest' | 'resort' | 'tourism' | 'other'

export type PricingRuleType = 'weekly_discount' | 'monthly_discount' | 'seasonal' | 'last_minute' | 'early_bird' | 'length_of_stay'

export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed' | 'cancelled'

export type ConversationStatus = 'active' | 'archived' | 'closed'

export type MessageDirection = 'inbound' | 'outbound'

export type MessageSenderType = 'guest' | 'host' | 'system'

export type AmenityCategory =
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'entertainment'
  | 'safety'
  | 'outdoor'
  | 'accessibility'
  | 'heating_cooling'
  | 'internet'
  | 'parking'
  | 'services'
  | 'other'

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'villa'
  | 'cabin'
  | 'cottage'
  | 'condo'
  | 'townhouse'
  | 'loft'
  | 'studio'
  | 'hotel_room'
  | 'hostel'
  | 'resort'
  | 'boat'
  | 'camper'
  | 'treehouse'
  | 'other'

// Table row types
export interface Tenant {
  id: string
  name: string
  slug: string
  default_currency: string
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
  oauth_token?: string | null
  oauth_refresh_token?: string | null
  oauth_expires_at?: string | null
  api_key?: string | null
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
  // OAuth specific
  client_id?: string
  redirect_uri?: string
  scopes?: string[]
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
  sync_status: PropertySyncStatus
  listing_url?: string | null
  is_active: boolean
  thumbnail_url?: string | null
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
  guest_profile_id?: string | null
  num_guests?: number | null
  total_price?: number | null
  currency: string
  notes?: string | null
  special_requests?: string | null
  confirmation_code?: string | null
  source_url?: string | null
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

// New tables from extended schema

export interface GuestProfile {
  id: string
  tenant_id: string
  name: string
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  source_provider?: IntegrationProvider | null
  external_id?: string | null
  total_bookings: number
  average_rating?: number | null
  notes?: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PropertyPhoto {
  id: string
  tenant_id: string
  property_id: string
  url: string
  thumbnail_url?: string | null
  caption?: string | null
  position: number
  is_primary: boolean
  source_provider?: IntegrationProvider | null
  external_id?: string | null
  width?: number | null
  height?: number | null
  created_at: string
  updated_at: string
}

export interface PropertyAmenity {
  id: string
  tenant_id: string
  property_id: string
  name: string
  category: AmenityCategory
  icon?: string | null
  source_provider?: IntegrationProvider | null
  is_highlighted: boolean
  created_at: string
  updated_at: string
}

export interface PropertyDetails {
  id: string
  tenant_id: string
  property_id: string
  description?: string | null
  short_description?: string | null
  property_type?: PropertyType | null
  check_in_time?: string | null
  check_out_time?: string | null
  check_in_instructions?: string | null
  cancellation_policy?: string | null
  house_rules?: string | null
  instant_book_enabled: boolean
  min_nights: number
  max_nights?: number | null
  latitude?: number | null
  longitude?: number | null
  neighborhood?: string | null
  transit_info?: string | null
  space_description?: string | null
  guest_access?: string | null
  interaction?: string | null
  wifi_name?: string | null
  wifi_password?: string | null
  door_code?: string | null
  created_at: string
  updated_at: string
}

export interface GuestReview {
  id: string
  tenant_id: string
  property_id: string
  booking_id?: string | null
  reviewer_name: string
  reviewer_avatar_url?: string | null
  rating: number
  rating_cleanliness?: number | null
  rating_communication?: number | null
  rating_check_in?: number | null
  rating_accuracy?: number | null
  rating_location?: number | null
  rating_value?: number | null
  review_text?: string | null
  review_date: string
  host_response?: string | null
  host_response_date?: string | null
  source_provider?: IntegrationProvider | null
  external_id?: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface PricingRule {
  id: string
  tenant_id: string
  property_id: string
  name: string
  rule_type: PricingRuleType
  discount_percent?: number | null
  min_nights?: number | null
  max_nights?: number | null
  start_date?: string | null
  end_date?: string | null
  days_before_checkin?: number | null
  is_active: boolean
  source_provider?: IntegrationProvider | null
  created_at: string
  updated_at: string
}

export interface PropertyFee {
  id: string
  tenant_id: string
  property_id: string
  fee_type: FeeType
  name: string
  amount: number
  currency: string
  is_percentage: boolean
  per_night: boolean
  per_guest: boolean
  min_guests_for_fee?: number | null
  is_mandatory: boolean
  source_provider?: IntegrationProvider | null
  created_at: string
  updated_at: string
}

export interface BookingPayment {
  id: string
  tenant_id: string
  booking_id: string
  status: PaymentStatus
  amount: number
  currency: string
  payment_method?: string | null
  transaction_id?: string | null
  payment_date?: string | null
  refund_amount?: number | null
  refund_date?: string | null
  notes?: string | null
  source_provider?: IntegrationProvider | null
  external_id?: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  tenant_id: string
  booking_id?: string | null
  property_id?: string | null
  integration_id?: string | null
  source_provider?: string | null
  external_id?: string | null
  guest_name: string
  guest_avatar_url?: string | null
  guest_profile_id?: string | null
  subject?: string | null
  status: ConversationStatus
  last_message_at?: string | null
  last_message_preview?: string | null
  unread_count: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  tenant_id: string
  conversation_id: string
  source_provider?: string | null
  external_id?: string | null
  direction: MessageDirection
  sender_name: string
  sender_type: MessageSenderType
  content: string
  sent_at: string
  read_at?: string | null
  delivered_to_provider: boolean
  delivery_error?: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
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

export interface PropertyWithDetails extends Property {
  details?: PropertyDetails | null
  photos?: PropertyPhoto[]
  amenities?: PropertyAmenity[]
  fees?: PropertyFee[]
  pricing_rules?: PricingRule[]
  reviews?: GuestReview[]
}

export interface BookingWithProperty extends Booking {
  property?: Property
}

export interface BookingWithDetails extends Booking {
  property?: Property
  guest_profile?: GuestProfile | null
  payments?: BookingPayment[]
}

export interface GuestProfileWithBookings extends GuestProfile {
  bookings?: Booking[]
}

export interface ConversationWithDetails extends Conversation {
  property?: Property | null
  booking?: Booking | null
  guest_profile?: GuestProfile | null
  messages?: Message[]
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
export type GuestProfileInsert = Omit<GuestProfile, 'id' | 'created_at' | 'updated_at'>
export type PropertyPhotoInsert = Omit<PropertyPhoto, 'id' | 'created_at' | 'updated_at'>
export type PropertyAmenityInsert = Omit<PropertyAmenity, 'id' | 'created_at' | 'updated_at'>
export type PropertyDetailsInsert = Omit<PropertyDetails, 'id' | 'created_at' | 'updated_at'>
export type GuestReviewInsert = Omit<GuestReview, 'id' | 'created_at' | 'updated_at'>
export type PricingRuleInsert = Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>
export type PropertyFeeInsert = Omit<PropertyFee, 'id' | 'created_at' | 'updated_at'>
export type BookingPaymentInsert = Omit<BookingPayment, 'id' | 'created_at' | 'updated_at'>
export type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
export type MessageInsert = Omit<Message, 'id' | 'created_at' | 'updated_at'>

// Update types (all fields optional except id)
export type TenantUpdate = Partial<Omit<Tenant, 'id' | 'created_at'>> & { id: string }
export type PropertyUpdate = Partial<Omit<Property, 'id' | 'created_at'>> & { id: string }
export type BookingUpdate = Partial<Omit<Booking, 'id' | 'created_at'>> & { id: string }
export type IntegrationUpdate = Partial<Omit<Integration, 'id' | 'created_at'>> & { id: string }
export type GuestProfileUpdate = Partial<Omit<GuestProfile, 'id' | 'created_at'>> & { id: string }
export type PropertyDetailsUpdate = Partial<Omit<PropertyDetails, 'id' | 'created_at'>> & { id: string }
export type PricingRuleUpdate = Partial<Omit<PricingRule, 'id' | 'created_at'>> & { id: string }
export type PropertyFeeUpdate = Partial<Omit<PropertyFee, 'id' | 'created_at'>> & { id: string }
export type ConversationUpdate = Partial<Omit<Conversation, 'id' | 'created_at'>> & { id: string }
export type MessageUpdate = Partial<Omit<Message, 'id' | 'created_at'>> & { id: string }
