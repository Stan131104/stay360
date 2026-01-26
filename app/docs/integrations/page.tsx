import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowRight, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react'

export default function IntegrationsPage() {
  return (
    <div className="py-8 px-6 lg:px-12 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Integrations</h1>
        <p className="text-lg text-muted-foreground">
          Connect your booking platforms to automatically sync properties and reservations.
        </p>
      </div>

      {/* Supported Platforms */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Supported Platforms</h2>
        <p className="text-muted-foreground mb-6">
          Stay360 supports any platform that provides iCal calendar feeds. This includes:
        </p>

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {[
            { name: 'Airbnb', desc: 'Export calendar via iCal URL' },
            { name: 'VRBO', desc: 'Export calendar via iCal URL' },
            { name: 'Booking.com', desc: 'Export calendar via iCal URL' },
            { name: 'HomeAway', desc: 'Export calendar via iCal URL' },
            { name: 'TripAdvisor', desc: 'Export calendar via iCal URL' },
            { name: 'Any iCal source', desc: 'Generic iCal feed support' },
          ].map((platform) => (
            <Card key={platform.name}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#669bbc]" />
                  <span className="font-medium">{platform.name}</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">{platform.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* iCal Setup */}
      <section id="ical-setup" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">iCal Setup Overview</h2>
        <p className="text-muted-foreground mb-4">
          iCal is a standard calendar format used by most booking platforms. Here's how it works:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
          <li><strong className="text-foreground">Export the iCal URL</strong> from your booking platform</li>
          <li><strong className="text-foreground">Add it to Stay360</strong> via the integrations page</li>
          <li><strong className="text-foreground">Stay360 fetches</strong> your calendar data automatically</li>
          <li><strong className="text-foreground">Bookings appear</strong> in your unified calendar</li>
        </ol>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>What data is synced?</AlertTitle>
          <AlertDescription>
            iCal feeds provide booking dates, guest names (when available), and blocked periods.
            Pricing data is not included in standard iCal feeds.
          </AlertDescription>
        </Alert>
      </section>

      {/* Airbnb */}
      <section id="airbnb" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Airbnb Integration</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to get your Airbnb iCal URL</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Log in to your <a href="https://airbnb.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Airbnb account</a></li>
              <li>Go to <strong className="text-foreground">Calendar</strong> for your listing</li>
              <li>Click on <strong className="text-foreground">Availability</strong> tab</li>
              <li>Scroll down to <strong className="text-foreground">Connect to another website</strong></li>
              <li>Click <strong className="text-foreground">Export Calendar</strong></li>
              <li>Copy the iCal URL (starts with webcal:// or https://)</li>
              <li>Paste into Stay360 when adding a new integration</li>
            </ol>

            <Alert className="mt-4" variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The iCal URL is unique to your listing. Do not share it publicly as it contains booking information.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      {/* VRBO */}
      <section id="vrbo" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">VRBO Integration</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to get your VRBO iCal URL</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Log in to your <a href="https://vrbo.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">VRBO account</a></li>
              <li>Go to <strong className="text-foreground">Calendar</strong> in your dashboard</li>
              <li>Click the <strong className="text-foreground">gear icon</strong> or <strong className="text-foreground">Settings</strong></li>
              <li>Find <strong className="text-foreground">Import/Export calendar</strong></li>
              <li>Copy the <strong className="text-foreground">Export URL</strong></li>
              <li>Paste into Stay360 when adding a new integration</li>
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Booking.com */}
      <section id="booking-com" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Booking.com Integration</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to get your Booking.com iCal URL</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>Log in to your <a href="https://admin.booking.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Booking.com Extranet</a></li>
              <li>Go to <strong className="text-foreground">Rates and Availability</strong></li>
              <li>Click <strong className="text-foreground">Sync calendars</strong></li>
              <li>Select <strong className="text-foreground">Export calendar</strong></li>
              <li>Copy the provided iCal URL</li>
              <li>Paste into Stay360 when adding a new integration</li>
            </ol>

            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Booking.com may require you to enable calendar sync in your property settings first.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>

      {/* Managing Integrations */}
      <section id="managing-integrations" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Managing Integrations</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Adding a New Integration</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to <strong className="text-foreground">Dashboard</strong> &gt; <strong className="text-foreground">Settings</strong></li>
              <li>In the Integrations section, click <strong className="text-foreground">Add</strong></li>
              <li>Select the integration type (Airbnb, VRBO, etc.)</li>
              <li>Paste your iCal URL</li>
              <li>Enter a name for the property</li>
              <li>Click <strong className="text-foreground">Connect</strong></li>
              <li>Stay360 will sync your calendar immediately</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Syncing an Integration</h3>
            <p className="text-muted-foreground mb-2">
              To manually sync an integration:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to <strong className="text-foreground">Dashboard</strong> &gt; <strong className="text-foreground">Settings</strong></li>
              <li>Find the integration you want to sync</li>
              <li>Click the <strong className="text-foreground">Sync</strong> button</li>
              <li>Wait for the sync to complete</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Deleting an Integration</h3>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Deleting an integration will also delete all associated properties, bookings, and sync history.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to <strong className="text-foreground">Dashboard</strong> &gt; <strong className="text-foreground">Settings</strong></li>
              <li>Find the integration you want to delete</li>
              <li>Click the <strong className="text-foreground">Delete</strong> button</li>
              <li>Confirm the deletion in the dialog</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Integration Statuses</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">active</span>
                <span className="text-muted-foreground">Integration is working correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">pending</span>
                <span className="text-muted-foreground">Initial sync in progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">error</span>
                <span className="text-muted-foreground">Sync failed - check your iCal URL</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">disabled</span>
                <span className="text-muted-foreground">Integration is paused</span>
              </div>
            </div>
          </div>
        </div>
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
                  Learn more about how syncing works and troubleshoot issues.
                </p>
                <span className="text-sm font-medium text-primary flex items-center">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/calendar">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Calendar View</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  See all your synced bookings in the unified calendar.
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
