import type { Integration } from '@/lib/types/database'
import type {
  ProviderAdapter,
  ProviderListing,
  ProviderBooking,
  ProviderRate,
  ProviderError,
  SyncResult,
  DateRange,
} from './types'
import { registerProvider } from './types'

/**
 * Mock Channel Manager Provider
 * Returns sample data for development and testing
 */
export class MockChannelManagerAdapter implements ProviderAdapter {
  readonly provider = 'channel_manager_mock' as const
  readonly supportsWrite = true // Channel managers support write operations
  private integration: Integration | null = null

  // Sample listings
  private readonly sampleListings: ProviderListing[] = [
    {
      provider_id: 'mock_listing_1',
      name: 'Cozy Beach House',
      address: '123 Ocean Drive',
      city: 'Miami',
      country: 'USA',
      bedrooms: 3,
      bathrooms: 2,
      max_guests: 6,
      metadata: { amenities: ['wifi', 'pool', 'beach_access'] },
    },
    {
      provider_id: 'mock_listing_2',
      name: 'Downtown Luxury Apartment',
      address: '456 Main Street, Unit 12A',
      city: 'New York',
      country: 'USA',
      bedrooms: 2,
      bathrooms: 1,
      max_guests: 4,
      metadata: { amenities: ['wifi', 'gym', 'doorman'] },
    },
    {
      provider_id: 'mock_listing_3',
      name: 'Mountain Retreat Cabin',
      address: '789 Pine Trail',
      city: 'Aspen',
      country: 'USA',
      bedrooms: 4,
      bathrooms: 3,
      max_guests: 8,
      metadata: { amenities: ['wifi', 'fireplace', 'hot_tub', 'ski_storage'] },
    },
  ]

  async initialize(integration: Integration): Promise<void> {
    this.integration = integration
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    // Mock always succeeds (simulates API key validation)
    return { success: true }
  }

  async listListings(): Promise<ProviderListing[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    return this.sampleListings
  }

  async listBookings(range: DateRange): Promise<ProviderBooking[]> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const bookings: ProviderBooking[] = []
    const today = new Date()

    // Generate some sample bookings within the date range
    for (const listing of this.sampleListings) {
      // Past booking
      const pastCheckIn = new Date(today)
      pastCheckIn.setDate(pastCheckIn.getDate() - 10)
      const pastCheckOut = new Date(pastCheckIn)
      pastCheckOut.setDate(pastCheckOut.getDate() + 3)

      if (pastCheckIn >= range.start && pastCheckOut <= range.end) {
        bookings.push({
          provider_id: `mock_booking_${listing.provider_id}_past`,
          listing_provider_id: listing.provider_id,
          status: 'confirmed',
          check_in: pastCheckIn,
          check_out: pastCheckOut,
          guest_name: 'John Smith',
          guest_email: 'john.smith@example.com',
          num_guests: 2,
          total_price: 450.00,
          currency: 'USD',
          metadata: { source: 'airbnb' },
        })
      }

      // Current/upcoming booking
      const upcomingCheckIn = new Date(today)
      upcomingCheckIn.setDate(upcomingCheckIn.getDate() + 5)
      const upcomingCheckOut = new Date(upcomingCheckIn)
      upcomingCheckOut.setDate(upcomingCheckOut.getDate() + 4)

      if (upcomingCheckIn >= range.start && upcomingCheckOut <= range.end) {
        bookings.push({
          provider_id: `mock_booking_${listing.provider_id}_upcoming`,
          listing_provider_id: listing.provider_id,
          status: 'confirmed',
          check_in: upcomingCheckIn,
          check_out: upcomingCheckOut,
          guest_name: 'Jane Doe',
          guest_email: 'jane.doe@example.com',
          num_guests: 4,
          total_price: 800.00,
          currency: 'USD',
          metadata: { source: 'booking.com' },
        })
      }

      // Owner block
      const blockStart = new Date(today)
      blockStart.setDate(blockStart.getDate() + 15)
      const blockEnd = new Date(blockStart)
      blockEnd.setDate(blockEnd.getDate() + 2)

      if (blockStart >= range.start && blockEnd <= range.end) {
        bookings.push({
          provider_id: `mock_booking_${listing.provider_id}_block`,
          listing_provider_id: listing.provider_id,
          status: 'blocked',
          check_in: blockStart,
          check_out: blockEnd,
          notes: 'Owner block - maintenance',
          metadata: {},
        })
      }
    }

    return bookings
  }

  async listRates(range: DateRange): Promise<ProviderRate[]> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const rates: ProviderRate[] = []
    const currentDate = new Date(range.start)

    // Base prices per listing
    const basePrices: Record<string, number> = {
      'mock_listing_1': 150, // Beach house
      'mock_listing_2': 200, // Luxury apartment
      'mock_listing_3': 250, // Mountain cabin
    }

    while (currentDate <= range.end) {
      const dayOfWeek = currentDate.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6

      for (const listing of this.sampleListings) {
        const basePrice = basePrices[listing.provider_id] || 100
        // Weekend markup
        const price = isWeekend ? basePrice * 1.25 : basePrice

        rates.push({
          listing_provider_id: listing.provider_id,
          date: new Date(currentDate),
          price,
          min_nights: isWeekend ? 2 : 1,
          currency: 'USD',
          metadata: { is_weekend: isWeekend },
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return rates
  }

  async sync(range: DateRange): Promise<SyncResult> {
    const errors: ProviderError[] = []

    const [listings, bookings, rates] = await Promise.all([
      this.listListings(),
      this.listBookings(range),
      this.listRates(range),
    ])

    return {
      listings,
      bookings,
      rates,
      errors,
    }
  }
}

// Factory function
function createMockAdapter(_integration: Integration): ProviderAdapter {
  const adapter = new MockChannelManagerAdapter()
  return adapter
}

// Register the mock provider
registerProvider('channel_manager_mock', createMockAdapter)
