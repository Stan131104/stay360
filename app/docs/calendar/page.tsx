import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, Info, Calendar } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="py-8 px-6 lg:px-12 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Calendar & Bookings</h1>
        <p className="text-lg text-muted-foreground">
          View and manage all your reservations in one unified calendar.
        </p>
      </div>

      {/* Calendar View */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Calendar View</h2>
        <p className="text-muted-foreground mb-4">
          The calendar view shows all your bookings across all properties in a visual grid format.
          Each row represents a property, and bookings are displayed as colored bars spanning their dates.
        </p>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Calendar className="h-5 w-5 text-[#669bbc]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Calendar Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- View bookings across all properties</li>
                  <li>- Navigate between months and years</li>
                  <li>- See booking status at a glance (color-coded)</li>
                  <li>- Jump to today's date with one click</li>
                  <li>- Responsive design for all screen sizes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Booking Statuses */}
      <section id="booking-statuses" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Booking Statuses</h2>
        <p className="text-muted-foreground mb-4">
          Bookings are color-coded based on their status:
        </p>

        <div className="space-y-3 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className="w-4 h-4 rounded bg-green-500 shrink-0" />
              <div>
                <span className="font-semibold">Confirmed</span>
                <p className="text-sm text-muted-foreground">Guest has confirmed the reservation</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className="w-4 h-4 rounded bg-yellow-500 shrink-0" />
              <div>
                <span className="font-semibold">Pending</span>
                <p className="text-sm text-muted-foreground">Awaiting confirmation</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className="w-4 h-4 rounded bg-gray-500 shrink-0" />
              <div>
                <span className="font-semibold">Blocked</span>
                <p className="text-sm text-muted-foreground">Dates blocked by owner (not a guest booking)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className="w-4 h-4 rounded bg-red-500 shrink-0" />
              <div>
                <span className="font-semibold">Cancelled</span>
                <p className="text-sm text-muted-foreground">Reservation was cancelled</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Status is determined automatically from the iCal data. "Blocked" dates are typically
            owner blocks or holds from the booking platform.
          </AlertDescription>
        </Alert>
      </section>

      {/* Navigation */}
      <section id="navigation" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Navigation</h2>
        <p className="text-muted-foreground mb-4">
          The calendar provides several ways to navigate:
        </p>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-semibold">Month Navigation</h3>
              <p className="text-sm text-muted-foreground">
                Use the left and right arrows to move between months, or use the month dropdown
                to jump to a specific month.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-semibold">Year Selection</h3>
              <p className="text-sm text-muted-foreground">
                Use the year dropdown to jump to a different year. Useful for viewing
                future reservations or past booking history.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-semibold">Today Button</h3>
              <p className="text-sm text-muted-foreground">
                Click "Today" to instantly jump back to the current month.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bookings List */}
      <section id="bookings-list" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Bookings List</h2>
        <p className="text-muted-foreground mb-4">
          In addition to the calendar view, you can also view bookings in a list format:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
          <li>Go to <strong className="text-foreground">Dashboard</strong> &gt; <strong className="text-foreground">Bookings</strong></li>
          <li>View all bookings in a sortable table</li>
          <li>See property name, guest info, dates, and status</li>
        </ol>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Booking Information</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Each booking entry shows:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>- Property name</li>
              <li>- Guest name (when available from iCal)</li>
              <li>- Check-in date</li>
              <li>- Check-out date</li>
              <li>- Booking status</li>
              <li>- Total price (when available)</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Tips */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Tips</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">1.</span>
            <span>Use the calendar to quickly spot gaps in your booking schedule.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">2.</span>
            <span>Check for overlapping bookings from different platforms - they may indicate sync issues.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">3.</span>
            <span>Sync regularly to keep your calendar up to date with the latest reservations.</span>
          </li>
        </ul>
      </section>

      {/* Next Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Next Steps</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/docs/sync">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Data Sync</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Learn how to keep your calendar data up to date.
                </p>
                <span className="text-sm font-medium text-primary flex items-center">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/properties">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Properties</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Manage your rental properties.
                </p>
                <span className="text-sm font-medium text-primary flex items-center">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  )
}
