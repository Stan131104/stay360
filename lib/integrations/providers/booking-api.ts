import type { Integration } from '@/lib/types/database'
import type {
  ProviderAdapter,
  ProviderListing,
  ProviderBooking,
  ProviderRate,
  ProviderReview,
  ProviderConversation,
  ProviderError,
  SyncResult,
  DateRange,
  UpdateListingRequest,
  UpdateAvailabilityRequest,
  UpdatePricingRequest,
  WriteResult,
  SendMessageRequest,
} from './types'
import { registerProvider } from './types'

/**
 * Simulated Booking.com Connectivity API Provider Adapter
 *
 * Note: The real Booking.com API requires partner status and connectivity partnership.
 * This adapter simulates realistic API responses for development and testing.
 * Replace with real API calls when partner access is obtained.
 */
export class BookingApiAdapter implements ProviderAdapter {
  readonly provider = 'booking_api' as const
  readonly supportsWrite = true

  private integration: Integration | null = null
  private apiKey: string | null = null

  // Simulated listings with Booking.com style data
  private readonly simulatedListings: ProviderListing[] = [
    {
      provider_id: 'booking_prop_12345',
      name: 'Grand Hotel Suite - City Center',
      address: '250 Central Park West',
      city: 'New York',
      country: 'USA',
      bedrooms: 2,
      bathrooms: 2,
      max_guests: 4,
      listing_url: 'https://booking.com/hotel/us/grand-suite-nyc',
      thumbnail_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      is_active: true,
      description: 'Luxury hotel suite with stunning Central Park views. Full service hotel amenities including 24-hour concierge, room service, spa access, and valet parking. Perfect for business travelers or couples seeking a premium NYC experience.',
      short_description: 'Luxury suite with Central Park views',
      property_type: 'hotel_room',
      check_in_time: '15:00',
      check_out_time: '12:00',
      check_in_instructions: 'Check-in at front desk. Valid ID and credit card required.',
      cancellation_policy: 'Free cancellation until 48 hours before check-in',
      house_rules: 'Non-smoking property. Pets not allowed.',
      instant_book_enabled: true,
      min_nights: 1,
      max_nights: 30,
      latitude: 40.7812,
      longitude: -73.9665,
      neighborhood: 'Upper West Side',
      transit_info: 'Near 72nd Street subway station (B, C lines). JFK/LaGuardia 45-60 min.',
      photos: [
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400', caption: 'Suite living area', position: 0, is_primary: true, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400', caption: 'King bedroom', position: 1, is_primary: false, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400', caption: 'Park view', position: 2, is_primary: false, width: 1200, height: 800 },
      ],
      amenities: [
        { name: 'High-speed WiFi', category: 'internet', icon: 'wifi', is_highlighted: true },
        { name: 'Room service', category: 'services', icon: 'room-service', is_highlighted: true },
        { name: '24/7 Concierge', category: 'services', icon: 'concierge', is_highlighted: true },
        { name: 'Spa access', category: 'services', icon: 'spa', is_highlighted: true },
        { name: 'Fitness center', category: 'services', icon: 'gym', is_highlighted: false },
        { name: 'Minibar', category: 'kitchen', icon: 'minibar', is_highlighted: false },
        { name: 'In-room safe', category: 'safety', icon: 'safe', is_highlighted: false },
        { name: 'Air conditioning', category: 'heating_cooling', icon: 'ac', is_highlighted: false },
        { name: 'Flat-screen TV', category: 'entertainment', icon: 'tv', is_highlighted: false },
        { name: 'Valet parking', category: 'parking', icon: 'valet', is_highlighted: false },
      ],
      fees: [
        { fee_type: 'resort', name: 'Resort fee', amount: 45, currency: 'USD', per_night: true, is_mandatory: true },
        { fee_type: 'other', name: 'Valet parking', amount: 65, currency: 'USD', per_night: true, is_mandatory: false },
        { fee_type: 'tourism', name: 'City tax', amount: 3.5, is_percentage: true, is_mandatory: true },
      ],
    },
    {
      provider_id: 'booking_prop_67890',
      name: 'Charming B&B - Historic District',
      address: '15 Meeting Street',
      city: 'Charleston',
      country: 'USA',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 2,
      listing_url: 'https://booking.com/hotel/us/charleston-bnb',
      thumbnail_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400',
      is_active: true,
      description: 'Romantic bed and breakfast in a restored 1850s townhouse. Features original hardwood floors, period antiques, and a beautiful courtyard garden. Gourmet breakfast included daily.',
      short_description: 'Historic B&B with courtyard garden',
      property_type: 'other',
      check_in_time: '15:00',
      check_out_time: '11:00',
      check_in_instructions: 'Ring the bell at the main entrance. Innkeeper will greet you.',
      cancellation_policy: 'Free cancellation until 7 days before check-in',
      house_rules: 'Adults only (16+). Quiet hours 10pm-8am.',
      instant_book_enabled: true,
      min_nights: 2,
      max_nights: 14,
      latitude: 32.7765,
      longitude: -79.9311,
      neighborhood: 'French Quarter',
      photos: [
        { url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400', caption: 'Historic exterior', position: 0, is_primary: true, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400', caption: 'Courtyard garden', position: 1, is_primary: false, width: 1200, height: 800 },
      ],
      amenities: [
        { name: 'WiFi', category: 'internet', icon: 'wifi', is_highlighted: true },
        { name: 'Breakfast included', category: 'services', icon: 'breakfast', is_highlighted: true },
        { name: 'Courtyard garden', category: 'outdoor', icon: 'garden', is_highlighted: true },
        { name: 'Afternoon tea', category: 'services', icon: 'tea', is_highlighted: false },
        { name: 'Air conditioning', category: 'heating_cooling', icon: 'ac', is_highlighted: false },
        { name: 'Free parking', category: 'parking', icon: 'parking', is_highlighted: true },
      ],
      fees: [
        { fee_type: 'tourism', name: 'Local tax', amount: 12, is_percentage: true, is_mandatory: true },
      ],
    },
    {
      provider_id: 'booking_prop_24680',
      name: 'Seaside Resort Studio',
      address: '5001 Collins Avenue',
      city: 'Miami Beach',
      country: 'USA',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 3,
      listing_url: 'https://booking.com/hotel/us/miami-resort-studio',
      thumbnail_url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400',
      is_active: true,
      description: 'Modern resort studio with ocean views. Direct beach access, multiple pools, and on-site restaurants. Perfect for beach lovers and sun seekers.',
      short_description: 'Resort studio with beach access',
      property_type: 'resort',
      check_in_time: '16:00',
      check_out_time: '10:00',
      cancellation_policy: 'Free cancellation until 24 hours before check-in',
      house_rules: 'Pool hours 6am-10pm. Beach towels provided at pool deck.',
      instant_book_enabled: true,
      min_nights: 1,
      max_nights: 21,
      latitude: 25.8103,
      longitude: -80.1251,
      neighborhood: 'Mid-Beach',
      photos: [
        { url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400', caption: 'Resort pool area', position: 0, is_primary: true, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400', caption: 'Studio interior', position: 1, is_primary: false, width: 1200, height: 800 },
      ],
      amenities: [
        { name: 'WiFi', category: 'internet', icon: 'wifi', is_highlighted: true },
        { name: 'Beach access', category: 'outdoor', icon: 'beach', is_highlighted: true },
        { name: 'Multiple pools', category: 'outdoor', icon: 'pool', is_highlighted: true },
        { name: 'Fitness center', category: 'services', icon: 'gym', is_highlighted: false },
        { name: 'Kitchenette', category: 'kitchen', icon: 'kitchen', is_highlighted: false },
        { name: 'On-site dining', category: 'services', icon: 'restaurant', is_highlighted: false },
        { name: 'Air conditioning', category: 'heating_cooling', icon: 'ac', is_highlighted: false },
        { name: 'Smart TV', category: 'entertainment', icon: 'tv', is_highlighted: false },
      ],
      fees: [
        { fee_type: 'resort', name: 'Resort fee', amount: 39, currency: 'USD', per_night: true, is_mandatory: true },
        { fee_type: 'other', name: 'Self-parking', amount: 35, currency: 'USD', per_night: true, is_mandatory: false },
        { fee_type: 'tourism', name: 'Florida tax', amount: 13, is_percentage: true, is_mandatory: true },
      ],
    },
  ]

  // Simulated reviews (Booking.com style with verified badges)
  private readonly simulatedReviews: Record<string, ProviderReview[]> = {
    'booking_prop_12345': [
      {
        external_id: 'bcom_review_5001',
        reviewer_name: 'Thomas G.',
        rating: 9.2,
        rating_cleanliness: 9.5,
        rating_location: 10,
        rating_value: 8.5,
        review_text: 'Exceptional service and incredible views. The concierge helped us with restaurant reservations and show tickets. Highly recommend!',
        review_date: new Date('2024-11-20'),
      },
      {
        external_id: 'bcom_review_5002',
        reviewer_name: 'Marie L.',
        rating: 8.8,
        rating_cleanliness: 9.0,
        rating_location: 9.5,
        rating_value: 8.0,
        review_text: 'Beautiful suite, perfect location. The resort fee was a bit surprising but overall great value for NYC.',
        review_date: new Date('2024-11-05'),
      },
    ],
    'booking_prop_67890': [
      {
        external_id: 'bcom_review_6001',
        reviewer_name: 'Susan K.',
        rating: 9.8,
        rating_cleanliness: 10,
        rating_location: 10,
        rating_value: 9.5,
        review_text: 'Absolutely magical stay! The innkeepers are wonderful and the breakfast was divine. The courtyard garden is perfect for morning coffee.',
        review_date: new Date('2024-12-05'),
        host_response: 'Thank you Susan! We loved having you and hope to welcome you back soon!',
        host_response_date: new Date('2024-12-06'),
      },
    ],
    'booking_prop_24680': [
      {
        external_id: 'bcom_review_7001',
        reviewer_name: 'Carlos M.',
        rating: 8.5,
        rating_cleanliness: 8.5,
        rating_location: 9.0,
        rating_value: 8.0,
        review_text: 'Great resort for families. Kids loved the pools. Beach is beautiful. Rooms are clean and modern.',
        review_date: new Date('2024-12-12'),
      },
    ],
  }

  // Simulated conversations
  private readonly simulatedConversations: ProviderConversation[] = [
    {
      external_id: 'conv_booking_001',
      booking_provider_id: 'bcom_res_booking_prop_12345_current',
      listing_provider_id: 'booking_prop_12345',
      guest_name: 'Hans Mueller',
      guest_avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
      guest_external_id: 'bcom_guest_hm',
      subject: 'Current stay at Grand Hotel Suite',
      status: 'active',
      messages: [
        {
          external_id: 'bcom_msg_001_1',
          conversation_external_id: 'conv_booking_001',
          direction: 'inbound',
          sender_name: 'Hans Mueller',
          sender_type: 'guest',
          content: 'Guten Tag! We have arrived at the hotel but our room is not ready yet. The front desk said it will be another hour. Is there anything that can be done?',
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          external_id: 'bcom_msg_001_2',
          conversation_external_id: 'conv_booking_001',
          direction: 'outbound',
          sender_name: 'Hotel Concierge',
          sender_type: 'host',
          content: 'Hello Mr. Mueller! I sincerely apologize for the delay. I have arranged for complimentary drinks and snacks in our lounge while you wait. Your room will be prioritized and ready within 30 minutes.',
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 900000),
        },
        {
          external_id: 'bcom_msg_001_3',
          conversation_external_id: 'conv_booking_001',
          direction: 'inbound',
          sender_name: 'Hans Mueller',
          sender_type: 'guest',
          content: 'Thank you so much! The lounge is lovely and the staff has been very helpful. We appreciate the quick response.',
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1800000),
        },
        {
          external_id: 'bcom_msg_001_4',
          conversation_external_id: 'conv_booking_001',
          direction: 'inbound',
          sender_name: 'Hans Mueller',
          sender_type: 'guest',
          content: 'Quick question - can we book a table at the hotel restaurant for tonight? We heard the chef is excellent.',
          sent_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      ],
    },
    {
      external_id: 'conv_booking_002',
      booking_provider_id: 'bcom_res_booking_prop_67890_upcoming',
      listing_provider_id: 'booking_prop_67890',
      guest_name: 'Yuki Tanaka',
      guest_avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg',
      guest_external_id: 'bcom_guest_yt',
      subject: 'Upcoming stay at Charming B&B',
      status: 'active',
      messages: [
        {
          external_id: 'bcom_msg_002_1',
          conversation_external_id: 'conv_booking_002',
          direction: 'inbound',
          sender_name: 'Yuki Tanaka',
          sender_type: 'guest',
          content: 'Hello! I am very excited about my upcoming stay. I have some dietary restrictions - I am vegetarian. Will breakfast accommodate this?',
          sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          external_id: 'bcom_msg_002_2',
          conversation_external_id: 'conv_booking_002',
          direction: 'outbound',
          sender_name: 'Innkeeper',
          sender_type: 'host',
          content: 'Hello Yuki! Absolutely, we are happy to accommodate vegetarian diets. Our breakfast includes fresh fruit, homemade granola, eggs from local farms, artisan breads, and various pastries. We can also prepare special dishes if you let us know your preferences!',
          sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 7200000),
        },
        {
          external_id: 'bcom_msg_002_3',
          conversation_external_id: 'conv_booking_002',
          direction: 'inbound',
          sender_name: 'Yuki Tanaka',
          sender_type: 'guest',
          content: 'That sounds wonderful! I also wanted to ask about the best way to get from the airport to your B&B?',
          sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          external_id: 'bcom_msg_002_4',
          conversation_external_id: 'conv_booking_002',
          direction: 'outbound',
          sender_name: 'Innkeeper',
          sender_type: 'host',
          content: 'Great question! Charleston Airport is about 20 minutes away. We recommend using Lyft or Uber - it is usually around $25-30. Alternatively, we partner with a local car service that offers airport transfers for $35 flat rate. Just let me know your flight details and I can arrange it for you!',
          sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3600000),
        },
      ],
    },
    {
      external_id: 'conv_booking_003',
      listing_provider_id: 'booking_prop_24680',
      guest_name: 'Maria Garcia',
      guest_avatar_url: 'https://randomuser.me/api/portraits/women/29.jpg',
      guest_external_id: 'bcom_guest_mg',
      subject: 'Inquiry about Seaside Resort Studio',
      status: 'active',
      messages: [
        {
          external_id: 'bcom_msg_003_1',
          conversation_external_id: 'conv_booking_003',
          direction: 'inbound',
          sender_name: 'Maria Garcia',
          sender_type: 'guest',
          content: 'Hola! I am planning a trip with my two kids (ages 8 and 12). Is your resort family-friendly? Are there activities for children?',
          sent_at: new Date(Date.now() - 45 * 60 * 1000),
        },
      ],
    },
  ]

  async initialize(integration: Integration): Promise<void> {
    this.integration = integration
    this.apiKey = integration.api_key || null
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey && !this.integration?.api_key) {
      return { success: false, error: 'No API key configured. Please enter your Booking.com partner API key.' }
    }

    await new Promise(resolve => setTimeout(resolve, 200))
    return { success: true }
  }

  async listListings(): Promise<ProviderListing[]> {
    await new Promise(resolve => setTimeout(resolve, 150))
    return this.simulatedListings
  }

  async listBookings(range: DateRange): Promise<ProviderBooking[]> {
    await new Promise(resolve => setTimeout(resolve, 150))

    const bookings: ProviderBooking[] = []
    const today = new Date()

    for (const listing of this.simulatedListings) {
      // Current booking (in-house)
      const currentCheckIn = new Date(today)
      currentCheckIn.setDate(currentCheckIn.getDate() - 2)
      const currentCheckOut = new Date(currentCheckIn)
      currentCheckOut.setDate(currentCheckOut.getDate() + 5)

      if (currentCheckIn >= range.start && currentCheckOut <= range.end) {
        bookings.push({
          provider_id: `bcom_res_${listing.provider_id}_current`,
          listing_provider_id: listing.provider_id,
          status: 'confirmed',
          check_in: currentCheckIn,
          check_out: currentCheckOut,
          guest_name: 'Hans Mueller',
          guest_email: 'h.mueller@email.de',
          guest_phone: '+49 171 123 4567',
          num_guests: 2,
          total_price: listing.provider_id === 'booking_prop_12345' ? 2400 : listing.provider_id === 'booking_prop_67890' ? 850 : 1100,
          currency: 'USD',
          confirmation_code: `BK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          source_url: `https://admin.booking.com/reservations/${listing.provider_id}_current`,
          special_requests: 'High floor preferred. Late check-out if available.',
          guest: {
            external_id: 'bcom_guest_hm',
            name: 'Hans Mueller',
            email: 'h.mueller@email.de',
            total_bookings: 28,
            average_rating: 4.9,
          },
          payment_status: 'paid',
          payment_amount: listing.provider_id === 'booking_prop_12345' ? 2400 : listing.provider_id === 'booking_prop_67890' ? 850 : 1100,
          payment_date: new Date(today.getTime() - 86400000 * 3),
        })
      }

      // Upcoming booking
      const upcomingCheckIn = new Date(today)
      upcomingCheckIn.setDate(upcomingCheckIn.getDate() + 7)
      const upcomingCheckOut = new Date(upcomingCheckIn)
      upcomingCheckOut.setDate(upcomingCheckOut.getDate() + 4)

      if (upcomingCheckIn >= range.start && upcomingCheckOut <= range.end) {
        bookings.push({
          provider_id: `bcom_res_${listing.provider_id}_upcoming`,
          listing_provider_id: listing.provider_id,
          status: 'confirmed',
          check_in: upcomingCheckIn,
          check_out: upcomingCheckOut,
          guest_name: 'Yuki Tanaka',
          guest_email: 'y.tanaka@email.jp',
          num_guests: 2,
          total_price: 1800,
          currency: 'USD',
          confirmation_code: `BK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          payment_status: 'partially_paid',
          payment_amount: 900,
        })
      }

      // Far future booking
      const futureCheckIn = new Date(today)
      futureCheckIn.setDate(futureCheckIn.getDate() + 30)
      const futureCheckOut = new Date(futureCheckIn)
      futureCheckOut.setDate(futureCheckOut.getDate() + 3)

      if (futureCheckIn >= range.start && futureCheckOut <= range.end) {
        bookings.push({
          provider_id: `bcom_res_${listing.provider_id}_future`,
          listing_provider_id: listing.provider_id,
          status: 'pending',
          check_in: futureCheckIn,
          check_out: futureCheckOut,
          guest_name: 'Emma Watson',
          guest_email: 'emma.w@email.com',
          num_guests: 1,
          total_price: 950,
          currency: 'USD',
          confirmation_code: `BK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          payment_status: 'pending',
          notes: 'Pending payment - 24hr hold',
        })
      }
    }

    return bookings
  }

  async listRates(range: DateRange): Promise<ProviderRate[]> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const rates: ProviderRate[] = []
    const currentDate = new Date(range.start)

    const basePrices: Record<string, number> = {
      'booking_prop_12345': 450,
      'booking_prop_67890': 195,
      'booking_prop_24680': 225,
    }

    while (currentDate <= range.end) {
      const dayOfWeek = currentDate.getDay()
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6

      for (const listing of this.simulatedListings) {
        const basePrice = basePrices[listing.provider_id] || 200
        let price = isWeekend ? basePrice * 1.2 : basePrice

        // Seasonal adjustments
        const month = currentDate.getMonth()
        // Summer premium for Miami
        if (listing.provider_id === 'booking_prop_24680' && month >= 5 && month <= 8) {
          price *= 1.15
        }
        // Holiday premium for NYC
        if (listing.provider_id === 'booking_prop_12345' && month === 11) {
          price *= 1.4
        }

        rates.push({
          listing_provider_id: listing.provider_id,
          date: new Date(currentDate),
          price: Math.round(price),
          min_nights: listing.min_nights || 1,
          currency: 'USD',
          available: true,
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return rates
  }

  async listReviews(listingProviderId: string): Promise<ProviderReview[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    // Booking.com uses 1-10 scale, map to our 1-5 scale for consistency
    const reviews = this.simulatedReviews[listingProviderId] || []
    return reviews.map(r => ({
      ...r,
      rating: r.rating / 2, // Convert 10-scale to 5-scale
      rating_cleanliness: r.rating_cleanliness ? r.rating_cleanliness / 2 : undefined,
      rating_location: r.rating_location ? r.rating_location / 2 : undefined,
      rating_value: r.rating_value ? r.rating_value / 2 : undefined,
    }))
  }

  async sync(range: DateRange): Promise<SyncResult> {
    const errors: ProviderError[] = []
    let listings: ProviderListing[] = []
    let bookings: ProviderBooking[] = []
    let rates: ProviderRate[] = []
    let reviews: ProviderReview[] = []
    let conversations: ProviderConversation[] = []

    try {
      listings = await this.listListings()
    } catch (error) {
      errors.push({
        type: 'listings_fetch_error',
        message: error instanceof Error ? error.message : 'Failed to fetch listings',
      })
    }

    try {
      bookings = await this.listBookings(range)
    } catch (error) {
      errors.push({
        type: 'bookings_fetch_error',
        message: error instanceof Error ? error.message : 'Failed to fetch bookings',
      })
    }

    try {
      rates = await this.listRates(range)
    } catch (error) {
      errors.push({
        type: 'rates_fetch_error',
        message: error instanceof Error ? error.message : 'Failed to fetch rates',
      })
    }

    for (const listing of listings) {
      try {
        const listingReviews = await this.listReviews(listing.provider_id)
        reviews.push(...listingReviews)
      } catch {
        // Non-critical
      }
    }

    // Fetch conversations
    try {
      conversations = await this.listConversations()
    } catch {
      // Non-critical
    }

    return {
      listings,
      bookings,
      rates,
      reviews,
      conversations,
      errors,
    }
  }

  // =============================================
  // WRITE OPERATIONS
  // =============================================

  async updateListing(listingProviderId: string, data: UpdateListingRequest): Promise<WriteResult> {
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log(`[Booking.com API] Updating listing ${listingProviderId}:`, data)

    return {
      success: true,
      data: { property_id: listingProviderId, updated_fields: Object.keys(data) },
    }
  }

  async updateAvailability(listingProviderId: string, request: UpdateAvailabilityRequest): Promise<WriteResult> {
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log(`[Booking.com API] Updating availability for ${listingProviderId}:`, request)

    return {
      success: true,
      data: {
        property_id: listingProviderId,
        dates: {
          start: request.dates.start.toISOString(),
          end: request.dates.end.toISOString(),
        },
        available: request.available,
      },
    }
  }

  async updatePricing(listingProviderId: string, request: UpdatePricingRequest): Promise<WriteResult> {
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log(`[Booking.com API] Updating pricing for ${listingProviderId}:`, request)

    return {
      success: true,
      data: {
        property_id: listingProviderId,
        dates: {
          start: request.dates.start.toISOString(),
          end: request.dates.end.toISOString(),
        },
        price: request.price,
        currency: request.currency || 'USD',
      },
    }
  }

  async respondToReview(reviewId: string, response: string): Promise<WriteResult> {
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log(`[Booking.com API] Responding to review ${reviewId}:`, response)

    return {
      success: true,
      data: { review_id: reviewId, response_added: true },
    }
  }

  // =============================================
  // MESSAGING OPERATIONS
  // =============================================

  async listConversations(): Promise<ProviderConversation[]> {
    await new Promise(resolve => setTimeout(resolve, 150))
    return this.simulatedConversations
  }

  async sendMessage(request: SendMessageRequest): Promise<WriteResult> {
    await new Promise(resolve => setTimeout(resolve, 200))

    console.log(`[Booking.com API] Sending message to conversation ${request.conversation_external_id}:`, request.content)

    return {
      success: true,
      data: {
        conversation_id: request.conversation_external_id,
        message_id: `bcom_msg_${Date.now()}`,
        sent_at: new Date().toISOString(),
      },
    }
  }
}

// Factory function
function createBookingApiAdapter(integration: Integration): ProviderAdapter {
  const adapter = new BookingApiAdapter()
  return adapter
}

// Register the provider
registerProvider('booking_api', createBookingApiAdapter)
