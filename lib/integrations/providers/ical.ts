import type { Integration, IntegrationProvider } from '@/lib/types/database'
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
 * Parse iCal date string to Date object
 * Handles both DATE and DATE-TIME formats
 */
function parseICalDate(dateStr: string): Date {
  // Remove any timezone suffix for simple parsing
  const cleaned = dateStr.replace(/Z$/, '')

  // DATE format: YYYYMMDD
  if (cleaned.length === 8) {
    return new Date(
      parseInt(cleaned.slice(0, 4)),
      parseInt(cleaned.slice(4, 6)) - 1,
      parseInt(cleaned.slice(6, 8))
    )
  }

  // DATE-TIME format: YYYYMMDDTHHMMSS
  if (cleaned.includes('T')) {
    const [datePart, timePart] = cleaned.split('T')
    return new Date(
      parseInt(datePart.slice(0, 4)),
      parseInt(datePart.slice(4, 6)) - 1,
      parseInt(datePart.slice(6, 8)),
      parseInt(timePart.slice(0, 2) || '0'),
      parseInt(timePart.slice(2, 4) || '0'),
      parseInt(timePart.slice(4, 6) || '0')
    )
  }

  // Fallback
  return new Date(dateStr)
}

/**
 * Parse an iCal VEVENT into a booking
 */
interface ICalEvent {
  uid: string
  summary?: string
  dtstart: Date
  dtend: Date
  description?: string
}

function parseVEvent(eventText: string): ICalEvent | null {
  const lines = eventText.split(/\r?\n/)
  const event: Partial<ICalEvent> = {}

  for (const line of lines) {
    // Handle line continuations (lines starting with space/tab)
    const [keyPart, ...valueParts] = line.split(':')
    const value = valueParts.join(':')

    // Extract key without parameters (e.g., DTSTART;VALUE=DATE -> DTSTART)
    const key = keyPart.split(';')[0]

    switch (key) {
      case 'UID':
        event.uid = value
        break
      case 'SUMMARY':
        event.summary = value
        break
      case 'DTSTART':
        event.dtstart = parseICalDate(value)
        break
      case 'DTEND':
        event.dtend = parseICalDate(value)
        break
      case 'DESCRIPTION':
        event.description = value
        break
    }
  }

  // Validate required fields
  if (!event.uid || !event.dtstart || !event.dtend) {
    return null
  }

  return event as ICalEvent
}

/**
 * Parse iCal content and extract events
 */
function parseICal(icalContent: string): ICalEvent[] {
  const events: ICalEvent[] = []

  // Split by VEVENT blocks
  const eventMatches = icalContent.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)

  if (!eventMatches) {
    return events
  }

  for (const eventText of eventMatches) {
    const event = parseVEvent(eventText)
    if (event) {
      events.push(event)
    }
  }

  return events
}

/**
 * Extract calendar name from iCal content
 */
function extractCalendarName(icalContent: string): string | null {
  const match = icalContent.match(/X-WR-CALNAME:([^\r\n]+)/)
  return match ? match[1].trim() : null
}

/**
 * Determine if a booking is a block or confirmed reservation
 * Based on common Airbnb iCal patterns
 */
function determineBookingStatus(event: ICalEvent): 'blocked' | 'confirmed' {
  const summary = (event.summary || '').toLowerCase()

  // Airbnb blocked dates typically have "Not available" or "Blocked"
  if (
    summary.includes('not available') ||
    summary.includes('blocked') ||
    summary.includes('unavailable')
  ) {
    return 'blocked'
  }

  // Reserved/booked indicates a confirmed reservation
  if (
    summary.includes('reserved') ||
    summary.includes('booked') ||
    summary.includes('airbnb')
  ) {
    return 'confirmed'
  }

  // Default to blocked for safety (prevents double booking)
  return 'blocked'
}

/**
 * Extract guest name from iCal summary if available
 */
function extractGuestName(event: ICalEvent): string | undefined {
  const summary = event.summary || ''

  // Airbnb format: "Reserved - Guest Name" or "Airbnb (Guest Name)"
  const reservedMatch = summary.match(/reserved\s*[-:]\s*(.+)/i)
  if (reservedMatch) {
    return reservedMatch[1].trim()
  }

  const airbnbMatch = summary.match(/airbnb\s*\((.+)\)/i)
  if (airbnbMatch) {
    return airbnbMatch[1].trim()
  }

  return undefined
}

/**
 * iCal Provider Adapter
 * Fetches and parses iCal feeds from Airbnb, VRBO, Booking.com, etc.
 */
export class ICalProviderAdapter implements ProviderAdapter {
  readonly provider: IntegrationProvider
  private integration: Integration | null = null
  private icalUrls: string[] = []
  private propertyNames: (string | undefined)[] = []

  constructor(provider: IntegrationProvider = 'airbnb_ical') {
    this.provider = provider
  }

  async initialize(integration: Integration): Promise<void> {
    this.integration = integration
    this.icalUrls = integration.config.ical_urls || []
    this.propertyNames = integration.config.property_names || []

    if (this.icalUrls.length === 0) {
      throw new Error('No iCal URLs configured')
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (this.icalUrls.length === 0) {
      return { success: false, error: 'No iCal URLs configured' }
    }

    try {
      // Test first URL
      const response = await fetch(this.icalUrls[0], {
        method: 'GET',
        headers: { 'Accept': 'text/calendar' },
      })

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }

      const content = await response.text()
      if (!content.includes('BEGIN:VCALENDAR')) {
        return { success: false, error: 'Invalid iCal format' }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * For iCal, we create a virtual listing per URL
   * The property name can come from:
   * 1. User-provided name in config
   * 2. Calendar name from iCal (X-WR-CALNAME)
   * 3. Fallback to URL-based name
   */
  async listListings(): Promise<ProviderListing[]> {
    const listings: ProviderListing[] = []

    for (let i = 0; i < this.icalUrls.length; i++) {
      const url = this.icalUrls[i]
      let name = this.propertyNames[i]

      // If no user-provided name, try to fetch from iCal
      if (!name) {
        try {
          const response = await fetch(url, {
            headers: { 'Accept': 'text/calendar' },
            cache: 'no-store',
          })

          if (response.ok) {
            const content = await response.text()
            name = extractCalendarName(content) || undefined
          }
        } catch {
          // Ignore fetch errors for name extraction
        }
      }

      // Fallback name
      if (!name) {
        try {
          const urlObj = new URL(url)
          const pathPart = urlObj.pathname.split('/').pop()
          name = pathPart ? `Property ${pathPart.slice(0, 8)}` : `Property ${i + 1}`
        } catch {
          name = `Property ${i + 1}`
        }
      }

      listings.push({
        provider_id: `ical_${i}`,
        name,
        metadata: { ical_url: url, url_index: i },
      })
    }

    return listings
  }

  async listBookings(range: DateRange): Promise<ProviderBooking[]> {
    const bookings: ProviderBooking[] = []

    for (let i = 0; i < this.icalUrls.length; i++) {
      const url = this.icalUrls[i]
      const listingId = `ical_${i}`

      try {
        const response = await fetch(url, {
          headers: { 'Accept': 'text/calendar' },
          // Add cache control to get fresh data
          cache: 'no-store',
        })

        if (!response.ok) {
          console.error(`Failed to fetch iCal from ${url}: ${response.status}`)
          continue
        }

        const content = await response.text()
        const events = parseICal(content)

        for (const event of events) {
          // Filter events within date range
          if (event.dtend < range.start || event.dtstart > range.end) {
            continue
          }

          let checkIn = event.dtstart
          let checkOut = event.dtend

          // Handle single-day events or invalid dates where check_out <= check_in
          // In iCal, a single day block often has DTSTART=DTEND
          // We need check_out > check_in for the database constraint
          if (checkOut <= checkIn) {
            // Make it a 1-day booking by adding 1 day to check_out
            checkOut = new Date(checkIn)
            checkOut.setDate(checkOut.getDate() + 1)
          }

          bookings.push({
            provider_id: event.uid,
            listing_provider_id: listingId,
            status: determineBookingStatus(event),
            check_in: checkIn,
            check_out: checkOut,
            guest_name: extractGuestName(event),
            notes: event.description,
            metadata: {
              summary: event.summary,
              source_url: url,
            },
          })
        }
      } catch (error) {
        console.error(`Error fetching iCal from ${url}:`, error)
      }
    }

    return bookings
  }

  /**
   * iCal does not provide pricing information
   */
  async listRates(_range: DateRange): Promise<ProviderRate[]> {
    return []
  }

  async sync(range: DateRange): Promise<SyncResult> {
    const errors: ProviderError[] = []
    let listings: ProviderListing[] = []
    let bookings: ProviderBooking[] = []

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

    return {
      listings,
      bookings,
      rates: [], // iCal doesn't provide rates
      errors,
    }
  }
}

// Factory function
function createICalAdapter(integration: Integration): ProviderAdapter {
  const adapter = new ICalProviderAdapter(integration.provider)
  // Note: initialize() must be called separately
  return adapter
}

// Register all iCal-based providers
registerProvider('airbnb_ical', createICalAdapter)
registerProvider('vrbo_ical', createICalAdapter)
registerProvider('booking_ical', createICalAdapter)
registerProvider('generic_ical', createICalAdapter)
