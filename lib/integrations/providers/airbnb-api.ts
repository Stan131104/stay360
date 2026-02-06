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
 * Simulated Airbnb API Provider Adapter
 *
 * Note: The real Airbnb API requires partner status and approval.
 * This adapter simulates realistic API responses for development and testing.
 * Replace with real API calls when partner access is obtained.
 */
export class AirbnbApiAdapter implements ProviderAdapter {
  readonly provider = 'airbnb_api' as const
  readonly supportsWrite = true

  private integration: Integration | null = null
  private accessToken: string | null = null

  // Simulated listings with full details
  private readonly simulatedListings: ProviderListing[] = [
    {
      provider_id: 'airbnb_123456',
      name: 'Stunning Oceanfront Villa',
      address: '42 Seaside Boulevard',
      city: 'Malibu',
      country: 'USA',
      bedrooms: 4,
      bathrooms: 3.5,
      max_guests: 8,
      listing_url: 'https://airbnb.com/rooms/123456',
      thumbnail_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400',
      is_active: true,
      description: 'Wake up to breathtaking ocean views in this stunning beachfront villa. Perfect for families or groups seeking a luxurious coastal getaway. Enjoy direct beach access, a private pool, and world-class amenities.',
      short_description: 'Luxurious beachfront villa with private pool and ocean views',
      property_type: 'villa',
      check_in_time: '16:00',
      check_out_time: '11:00',
      check_in_instructions: 'Use the lockbox on the front door. Code will be sent 24 hours before check-in.',
      cancellation_policy: 'Strict - 50% refund up until 1 week prior to arrival',
      house_rules: 'No smoking. No parties or events. Pets allowed with prior approval.',
      instant_book_enabled: true,
      min_nights: 2,
      max_nights: 30,
      latitude: 34.0259,
      longitude: -118.7798,
      neighborhood: 'Malibu Beach',
      transit_info: 'LAX airport is 45 minutes away. Uber/Lyft recommended.',
      space_description: 'The villa spans 3,500 sq ft across two floors with an open-concept living area.',
      guest_access: 'Full access to the entire property including pool, hot tub, and private beach.',
      interaction: 'Self check-in. Host available by phone/text for any questions.',
      wifi_name: 'VillaGuest',
      wifi_password: 'OceanView2024',
      door_code: '4521',
      photos: [
        { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400', caption: 'Ocean view from living room', position: 0, is_primary: true, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=400', caption: 'Master bedroom', position: 1, is_primary: false, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', caption: 'Private pool area', position: 2, is_primary: false, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', caption: 'Gourmet kitchen', position: 3, is_primary: false, width: 1200, height: 800 },
      ],
      amenities: [
        { name: 'WiFi', category: 'internet', icon: 'wifi', is_highlighted: true },
        { name: 'Private pool', category: 'outdoor', icon: 'pool', is_highlighted: true },
        { name: 'Hot tub', category: 'outdoor', icon: 'hot-tub', is_highlighted: true },
        { name: 'Beach access', category: 'outdoor', icon: 'beach', is_highlighted: true },
        { name: 'Kitchen', category: 'kitchen', icon: 'kitchen', is_highlighted: false },
        { name: 'Dishwasher', category: 'kitchen', icon: 'dishwasher', is_highlighted: false },
        { name: 'Washer/Dryer', category: 'services', icon: 'laundry', is_highlighted: false },
        { name: 'Air conditioning', category: 'heating_cooling', icon: 'ac', is_highlighted: false },
        { name: 'Smart TV', category: 'entertainment', icon: 'tv', is_highlighted: false },
        { name: 'BBQ grill', category: 'outdoor', icon: 'grill', is_highlighted: false },
        { name: 'Fire extinguisher', category: 'safety', icon: 'fire-extinguisher', is_highlighted: false },
        { name: 'First aid kit', category: 'safety', icon: 'first-aid', is_highlighted: false },
        { name: 'Free parking', category: 'parking', icon: 'parking', is_highlighted: true },
      ],
      fees: [
        { fee_type: 'cleaning', name: 'Cleaning fee', amount: 250, currency: 'USD', is_mandatory: true },
        { fee_type: 'service', name: 'Service fee', amount: 14, is_percentage: true, is_mandatory: true },
        { fee_type: 'pet', name: 'Pet fee', amount: 75, currency: 'USD', is_mandatory: false },
      ],
      pricing_rules: [
        { name: 'Weekly discount', rule_type: 'weekly_discount', discount_percent: 10, min_nights: 7 },
        { name: 'Monthly discount', rule_type: 'monthly_discount', discount_percent: 20, min_nights: 28 },
      ],
    },
    {
      provider_id: 'airbnb_789012',
      name: 'Modern Downtown Loft',
      address: '100 Arts District Way, Unit 502',
      city: 'Los Angeles',
      country: 'USA',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 4,
      listing_url: 'https://airbnb.com/rooms/789012',
      thumbnail_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      is_active: true,
      description: 'Experience LA living in this stylish industrial loft in the heart of the Arts District. Walking distance to galleries, restaurants, and nightlife.',
      short_description: 'Stylish industrial loft in LA Arts District',
      property_type: 'loft',
      check_in_time: '15:00',
      check_out_time: '11:00',
      check_in_instructions: 'Building concierge will provide key. Show ID at front desk.',
      cancellation_policy: 'Flexible - Full refund up to 24 hours before check-in',
      house_rules: 'No smoking. Quiet hours after 10pm. No parties.',
      instant_book_enabled: true,
      min_nights: 1,
      max_nights: 90,
      latitude: 34.0407,
      longitude: -118.2345,
      neighborhood: 'Arts District',
      transit_info: 'Metro Gold Line Little Tokyo station 5 min walk. Street parking available.',
      photos: [
        { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', caption: 'Open living space', position: 0, is_primary: true, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', caption: 'Bedroom area', position: 1, is_primary: false, width: 1200, height: 800 },
      ],
      amenities: [
        { name: 'WiFi', category: 'internet', icon: 'wifi', is_highlighted: true },
        { name: 'Kitchen', category: 'kitchen', icon: 'kitchen', is_highlighted: false },
        { name: 'Air conditioning', category: 'heating_cooling', icon: 'ac', is_highlighted: false },
        { name: 'Workspace', category: 'services', icon: 'desk', is_highlighted: true },
        { name: 'Smart TV', category: 'entertainment', icon: 'tv', is_highlighted: false },
        { name: 'Gym access', category: 'services', icon: 'gym', is_highlighted: true },
        { name: 'Rooftop access', category: 'outdoor', icon: 'rooftop', is_highlighted: true },
      ],
      fees: [
        { fee_type: 'cleaning', name: 'Cleaning fee', amount: 85, currency: 'USD', is_mandatory: true },
        { fee_type: 'service', name: 'Service fee', amount: 14, is_percentage: true, is_mandatory: true },
      ],
      pricing_rules: [
        { name: 'Weekly discount', rule_type: 'weekly_discount', discount_percent: 15, min_nights: 7 },
      ],
    },
    {
      provider_id: 'airbnb_345678',
      name: 'Cozy Mountain Cabin',
      address: '888 Alpine Road',
      city: 'Big Bear Lake',
      country: 'USA',
      bedrooms: 3,
      bathrooms: 2,
      max_guests: 6,
      listing_url: 'https://airbnb.com/rooms/345678',
      thumbnail_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400',
      is_active: true,
      description: 'Escape to this charming A-frame cabin surrounded by pine trees. Perfect for skiing in winter or hiking in summer. Features a cozy fireplace and hot tub on the deck.',
      short_description: 'Charming A-frame cabin with hot tub and fireplace',
      property_type: 'cabin',
      check_in_time: '16:00',
      check_out_time: '10:00',
      check_in_instructions: 'Keypad entry. Code: 7890#',
      cancellation_policy: 'Moderate - Full refund up to 5 days before check-in',
      house_rules: 'Firewood provided - do not bring outside wood. Bear-proof trash required.',
      instant_book_enabled: false,
      min_nights: 2,
      max_nights: 14,
      latitude: 34.2439,
      longitude: -116.9114,
      neighborhood: 'Big Bear Village',
      wifi_name: 'CabinWiFi',
      wifi_password: 'Mountain2024',
      door_code: '7890',
      photos: [
        { url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400', caption: 'Cabin exterior', position: 0, is_primary: true, width: 1200, height: 800 },
        { url: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200', thumbnail_url: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=400', caption: 'Living room with fireplace', position: 1, is_primary: false, width: 1200, height: 800 },
      ],
      amenities: [
        { name: 'WiFi', category: 'internet', icon: 'wifi', is_highlighted: true },
        { name: 'Fireplace', category: 'heating_cooling', icon: 'fireplace', is_highlighted: true },
        { name: 'Hot tub', category: 'outdoor', icon: 'hot-tub', is_highlighted: true },
        { name: 'Kitchen', category: 'kitchen', icon: 'kitchen', is_highlighted: false },
        { name: 'BBQ grill', category: 'outdoor', icon: 'grill', is_highlighted: false },
        { name: 'Board games', category: 'entertainment', icon: 'games', is_highlighted: false },
        { name: 'Ski storage', category: 'parking', icon: 'ski', is_highlighted: true },
        { name: 'Free parking', category: 'parking', icon: 'parking', is_highlighted: false },
      ],
      fees: [
        { fee_type: 'cleaning', name: 'Cleaning fee', amount: 125, currency: 'USD', is_mandatory: true },
        { fee_type: 'service', name: 'Service fee', amount: 14, is_percentage: true, is_mandatory: true },
        { fee_type: 'pet', name: 'Pet fee', amount: 50, currency: 'USD', is_mandatory: false },
      ],
      pricing_rules: [
        { name: 'Ski season', rule_type: 'seasonal', discount_percent: -25, start_date: new Date('2024-12-15'), end_date: new Date('2025-03-15') },
        { name: 'Last minute deal', rule_type: 'last_minute', discount_percent: 15, days_before_checkin: 3 },
      ],
    },
  ]

  // Simulated reviews
  private readonly simulatedReviews: Record<string, ProviderReview[]> = {
    'airbnb_123456': [
      {
        external_id: 'review_1001',
        reviewer_name: 'Sarah M.',
        reviewer_avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg',
        rating: 5,
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_check_in: 5,
        rating_accuracy: 5,
        rating_location: 5,
        rating_value: 4,
        review_text: 'Absolutely stunning property! The ocean views were breathtaking and the villa had everything we needed. Kids loved the pool. Will definitely come back!',
        review_date: new Date('2024-11-15'),
        host_response: 'Thank you so much Sarah! We loved hosting your family and hope to see you again soon!',
        host_response_date: new Date('2024-11-16'),
      },
      {
        external_id: 'review_1002',
        reviewer_name: 'Michael T.',
        reviewer_avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg',
        rating: 4.5,
        rating_cleanliness: 5,
        rating_communication: 4,
        rating_check_in: 5,
        rating_accuracy: 4,
        rating_location: 5,
        rating_value: 4,
        review_text: 'Great location and beautiful home. Only minor issue was the hot tub took a while to heat up. Otherwise perfect stay.',
        review_date: new Date('2024-10-28'),
      },
    ],
    'airbnb_789012': [
      {
        external_id: 'review_2001',
        reviewer_name: 'Emma L.',
        reviewer_avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg',
        rating: 5,
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_check_in: 5,
        rating_accuracy: 5,
        rating_location: 5,
        rating_value: 5,
        review_text: 'Perfect for my work trip! Great workspace, fast wifi, and amazing location. Could walk to everything.',
        review_date: new Date('2024-12-01'),
      },
    ],
    'airbnb_345678': [
      {
        external_id: 'review_3001',
        reviewer_name: 'David K.',
        reviewer_avatar_url: 'https://randomuser.me/api/portraits/men/4.jpg',
        rating: 5,
        rating_cleanliness: 5,
        rating_communication: 5,
        rating_check_in: 5,
        rating_accuracy: 5,
        rating_location: 5,
        rating_value: 5,
        review_text: 'Best cabin stay ever! Hot tub under the stars was magical. Fireplace was so cozy. Perfect mountain getaway.',
        review_date: new Date('2024-12-10'),
      },
    ],
  }

  // Simulated conversations
  private readonly simulatedConversations: ProviderConversation[] = [
    {
      external_id: 'conv_airbnb_001',
      booking_provider_id: 'booking_airbnb_123456_upcoming',
      listing_provider_id: 'airbnb_123456',
      guest_name: 'Jennifer Wilson',
      guest_avatar_url: 'https://randomuser.me/api/portraits/women/5.jpg',
      guest_external_id: 'guest_jw_123',
      subject: 'Upcoming stay at Stunning Oceanfront Villa',
      status: 'active',
      messages: [
        {
          external_id: 'msg_001_1',
          conversation_external_id: 'conv_airbnb_001',
          direction: 'inbound',
          sender_name: 'Jennifer Wilson',
          sender_type: 'guest',
          content: 'Hi! I just booked your beautiful villa for next week. We are so excited! I was wondering if early check-in might be possible? We are traveling with my elderly parents and the long flight will be tiring for them.',
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          external_id: 'msg_001_2',
          conversation_external_id: 'conv_airbnb_001',
          direction: 'outbound',
          sender_name: 'Host',
          sender_type: 'host',
          content: 'Hi Jennifer! Welcome, and thank you for booking! I completely understand about the long flight. I can offer you a 2pm early check-in at no extra charge. Would that work for you?',
          sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
        },
        {
          external_id: 'msg_001_3',
          conversation_external_id: 'conv_airbnb_001',
          direction: 'inbound',
          sender_name: 'Jennifer Wilson',
          sender_type: 'guest',
          content: 'That would be perfect! Thank you so much for accommodating us. One more question - is the pool heated? My parents love to swim but prefer warmer water.',
          sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          external_id: 'msg_001_4',
          conversation_external_id: 'conv_airbnb_001',
          direction: 'outbound',
          sender_name: 'Host',
          sender_type: 'host',
          content: 'Yes! The pool is heated and maintained at 82°F (28°C). Your parents will love it! I will also make sure to have extra pool towels ready for your arrival.',
          sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 7200000),
        },
        {
          external_id: 'msg_001_5',
          conversation_external_id: 'conv_airbnb_001',
          direction: 'inbound',
          sender_name: 'Jennifer Wilson',
          sender_type: 'guest',
          content: 'You are the best host ever! We cannot wait to arrive. See you soon!',
          sent_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
      ],
    },
    {
      external_id: 'conv_airbnb_002',
      booking_provider_id: 'booking_airbnb_789012_upcoming',
      listing_provider_id: 'airbnb_789012',
      guest_name: 'Marcus Chen',
      guest_avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg',
      guest_external_id: 'guest_mc_456',
      subject: 'Question about Modern Downtown Loft',
      status: 'active',
      messages: [
        {
          external_id: 'msg_002_1',
          conversation_external_id: 'conv_airbnb_002',
          direction: 'inbound',
          sender_name: 'Marcus Chen',
          sender_type: 'guest',
          content: 'Hello! I am considering booking your loft for a work trip next month. Does the workspace have good lighting for video calls? I will be doing remote work during my stay.',
          sent_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          external_id: 'msg_002_2',
          conversation_external_id: 'conv_airbnb_002',
          direction: 'outbound',
          sender_name: 'Host',
          sender_type: 'host',
          content: 'Hi Marcus! Great question. The workspace is positioned near large windows with plenty of natural light. There is also a ring light available if you need extra lighting for calls. The WiFi is 500 Mbps fiber - perfect for video conferencing!',
          sent_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          external_id: 'msg_002_3',
          conversation_external_id: 'conv_airbnb_002',
          direction: 'inbound',
          sender_name: 'Marcus Chen',
          sender_type: 'guest',
          content: 'That sounds perfect! Just booked. Looking forward to it!',
          sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      ],
    },
    {
      external_id: 'conv_airbnb_003',
      listing_provider_id: 'airbnb_345678',
      guest_name: 'Sarah & Tom',
      guest_avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
      guest_external_id: 'guest_st_789',
      subject: 'Inquiry about Cozy Mountain Cabin',
      status: 'active',
      messages: [
        {
          external_id: 'msg_003_1',
          conversation_external_id: 'conv_airbnb_003',
          direction: 'inbound',
          sender_name: 'Sarah & Tom',
          sender_type: 'guest',
          content: 'Hi there! We are planning a romantic getaway and your cabin looks amazing. Is the hot tub private? Also, do you allow dogs? We have a well-behaved golden retriever.',
          sent_at: new Date(Date.now() - 30 * 60 * 1000),
        },
      ],
    },
  ]

  async initialize(integration: Integration): Promise<void> {
    this.integration = integration
    this.accessToken = integration.oauth_token || null
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    // Simulate OAuth token validation
    if (!this.accessToken && !this.integration?.oauth_token) {
      return { success: false, error: 'No OAuth token configured. Please connect your Airbnb account.' }
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200))

    // In real implementation, this would validate the token with Airbnb API
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

    // Generate realistic bookings for each listing
    for (const listing of this.simulatedListings) {
      // Confirmed upcoming booking
      const upcomingCheckIn = new Date(today)
      upcomingCheckIn.setDate(upcomingCheckIn.getDate() + 3)
      const upcomingCheckOut = new Date(upcomingCheckIn)
      upcomingCheckOut.setDate(upcomingCheckOut.getDate() + 5)

      if (upcomingCheckIn >= range.start && upcomingCheckOut <= range.end) {
        const basePrice = listing.provider_id === 'airbnb_123456' ? 500 : listing.provider_id === 'airbnb_789012' ? 150 : 200
        const nights = 5
        const totalPrice = basePrice * nights

        bookings.push({
          provider_id: `booking_${listing.provider_id}_upcoming`,
          listing_provider_id: listing.provider_id,
          status: 'confirmed',
          check_in: upcomingCheckIn,
          check_out: upcomingCheckOut,
          guest_name: 'Jennifer Wilson',
          guest_email: 'jennifer.w@email.com',
          guest_phone: '+1 555-123-4567',
          num_guests: listing.provider_id === 'airbnb_123456' ? 6 : 2,
          total_price: totalPrice,
          currency: 'USD',
          confirmation_code: `HM${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          source_url: `https://airbnb.com/hosting/reservations/${listing.provider_id}_upcoming`,
          special_requests: listing.provider_id === 'airbnb_123456' ? 'Early check-in if possible. Traveling with elderly parents.' : undefined,
          guest: {
            external_id: 'guest_jw_123',
            name: 'Jennifer Wilson',
            email: 'jennifer.w@email.com',
            avatar_url: 'https://randomuser.me/api/portraits/women/5.jpg',
            total_bookings: 12,
            average_rating: 4.8,
          },
          payment_status: 'paid',
          payment_amount: totalPrice,
          payment_date: new Date(today.getTime() - 86400000 * 2),
        })
      }

      // Past completed booking
      const pastCheckIn = new Date(today)
      pastCheckIn.setDate(pastCheckIn.getDate() - 14)
      const pastCheckOut = new Date(pastCheckIn)
      pastCheckOut.setDate(pastCheckOut.getDate() + 3)

      if (pastCheckIn >= range.start && pastCheckOut <= range.end) {
        bookings.push({
          provider_id: `booking_${listing.provider_id}_past`,
          listing_provider_id: listing.provider_id,
          status: 'confirmed',
          check_in: pastCheckIn,
          check_out: pastCheckOut,
          guest_name: 'Robert Chen',
          guest_email: 'r.chen@email.com',
          num_guests: 4,
          total_price: 750,
          currency: 'USD',
          confirmation_code: `HM${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          payment_status: 'paid',
        })
      }

      // Future booking
      const futureCheckIn = new Date(today)
      futureCheckIn.setDate(futureCheckIn.getDate() + 21)
      const futureCheckOut = new Date(futureCheckIn)
      futureCheckOut.setDate(futureCheckOut.getDate() + 7)

      if (futureCheckIn >= range.start && futureCheckOut <= range.end) {
        bookings.push({
          provider_id: `booking_${listing.provider_id}_future`,
          listing_provider_id: listing.provider_id,
          status: 'confirmed',
          check_in: futureCheckIn,
          check_out: futureCheckOut,
          guest_name: 'Amanda Foster',
          guest_email: 'amanda.f@email.com',
          num_guests: 3,
          total_price: 1200,
          currency: 'USD',
          confirmation_code: `HM${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          payment_status: 'pending',
        })
      }

      // Owner block
      const blockStart = new Date(today)
      blockStart.setDate(blockStart.getDate() + 10)
      const blockEnd = new Date(blockStart)
      blockEnd.setDate(blockEnd.getDate() + 2)

      if (blockStart >= range.start && blockEnd <= range.end && listing.provider_id === 'airbnb_123456') {
        bookings.push({
          provider_id: `block_${listing.provider_id}`,
          listing_provider_id: listing.provider_id,
          status: 'blocked',
          check_in: blockStart,
          check_out: blockEnd,
          notes: 'Personal use - family visiting',
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
      'airbnb_123456': 495,
      'airbnb_789012': 145,
      'airbnb_345678': 195,
    }

    while (currentDate <= range.end) {
      const dayOfWeek = currentDate.getDay()
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Friday, Saturday

      for (const listing of this.simulatedListings) {
        const basePrice = basePrices[listing.provider_id] || 150

        // Weekend pricing (+30%)
        let price = isWeekend ? basePrice * 1.3 : basePrice

        // Seasonal pricing for cabin
        if (listing.provider_id === 'airbnb_345678') {
          const month = currentDate.getMonth()
          if (month >= 11 || month <= 2) { // Dec-Feb ski season
            price *= 1.25
          }
        }

        rates.push({
          listing_provider_id: listing.provider_id,
          date: new Date(currentDate),
          price: Math.round(price),
          min_nights: isWeekend ? (listing.min_nights || 2) : 1,
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
    return this.simulatedReviews[listingProviderId] || []
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

    // Fetch reviews for all listings
    for (const listing of listings) {
      try {
        const listingReviews = await this.listReviews(listing.provider_id)
        reviews.push(...listingReviews)
      } catch {
        // Non-critical, don't add to errors
      }
    }

    // Fetch conversations
    try {
      conversations = await this.listConversations()
    } catch {
      // Non-critical, don't add to errors
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

    // Simulate API call
    console.log(`[Airbnb API] Updating listing ${listingProviderId}:`, data)

    // In real implementation, this would call the Airbnb API
    // For now, simulate success
    return {
      success: true,
      data: { listing_id: listingProviderId, updated_fields: Object.keys(data) },
    }
  }

  async updateAvailability(listingProviderId: string, request: UpdateAvailabilityRequest): Promise<WriteResult> {
    await new Promise(resolve => setTimeout(resolve, 200))

    console.log(`[Airbnb API] Updating availability for ${listingProviderId}:`, request)

    return {
      success: true,
      data: {
        listing_id: listingProviderId,
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

    console.log(`[Airbnb API] Updating pricing for ${listingProviderId}:`, request)

    return {
      success: true,
      data: {
        listing_id: listingProviderId,
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

    console.log(`[Airbnb API] Responding to review ${reviewId}:`, response)

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

    console.log(`[Airbnb API] Sending message to conversation ${request.conversation_external_id}:`, request.content)

    return {
      success: true,
      data: {
        conversation_id: request.conversation_external_id,
        message_id: `msg_${Date.now()}`,
        sent_at: new Date().toISOString(),
      },
    }
  }
}

// Factory function
function createAirbnbApiAdapter(integration: Integration): ProviderAdapter {
  const adapter = new AirbnbApiAdapter()
  return adapter
}

// Register the provider
registerProvider('airbnb_api', createAirbnbApiAdapter)
