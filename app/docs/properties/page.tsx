import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowRight, AlertTriangle, Building2 } from 'lucide-react'

export default function PropertiesPage() {
  return (
    <div className="py-8 px-6 lg:px-12 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Properties</h1>
        <p className="text-lg text-muted-foreground">
          Manage your rental properties and view their booking status.
        </p>
      </div>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Overview</h2>
        <p className="text-muted-foreground mb-4">
          Properties are the rental units you manage through Stay360. They are automatically
          created when you connect an integration and sync your calendar data.
        </p>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Building2 className="h-5 w-5 text-[#669bbc]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Property Information</h3>
                <p className="text-sm text-muted-foreground">
                  Each property displays:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>- Property name</li>
                  <li>- Integration source (Airbnb, VRBO, etc.)</li>
                  <li>- Number of bookings</li>
                  <li>- Last sync time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Adding Properties */}
      <section id="adding-properties" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Adding Properties</h2>
        <p className="text-muted-foreground mb-4">
          Properties are added automatically when you connect an integration. Here's how:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
          <li>Go to <strong className="text-foreground">Dashboard</strong> &gt; <strong className="text-foreground">Settings</strong></li>
          <li>Click <strong className="text-foreground">Add</strong> in the Integrations section</li>
          <li>Select your booking platform (Airbnb, VRBO, etc.)</li>
          <li>Paste your iCal URL</li>
          <li>Enter a name for the property</li>
          <li>Click <strong className="text-foreground">Connect</strong></li>
        </ol>

        <p className="text-muted-foreground">
          After the initial sync, your property will appear in the Properties list with all its bookings.
        </p>
      </section>

      {/* Property Details */}
      <section id="property-details" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Property Details</h2>
        <p className="text-muted-foreground mb-4">
          Each property card shows the following information:
        </p>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-semibold">Property Name</h3>
              <p className="text-sm text-muted-foreground">
                The name you assigned during integration setup, or the name from the calendar feed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-semibold">Integration Source</h3>
              <p className="text-sm text-muted-foreground">
                Shows which platform this property is synced from (e.g., "Airbnb iCal", "VRBO iCal").
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-semibold">Booking Count</h3>
              <p className="text-sm text-muted-foreground">
                The total number of bookings associated with this property.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <h3 className="font-semibold">Actions</h3>
              <p className="text-sm text-muted-foreground">
                Delete the property (available to Owners and Managers only).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Deleting Properties */}
      <section id="deleting-properties" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Deleting Properties</h2>

        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Deleting a property will permanently remove all associated bookings and daily rates.
            This action cannot be undone.
          </AlertDescription>
        </Alert>

        <p className="text-muted-foreground mb-4">
          To delete a property:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
          <li>Go to <strong className="text-foreground">Dashboard</strong> &gt; <strong className="text-foreground">Properties</strong></li>
          <li>Find the property you want to delete</li>
          <li>Click the <strong className="text-foreground">Delete</strong> button (trash icon)</li>
          <li>Confirm the deletion in the dialog</li>
        </ol>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Who can delete properties?</h3>
            <p className="text-sm text-muted-foreground">
              Only users with <span className="font-medium">OWNER</span> or <span className="font-medium">MANAGER</span> roles
              can delete properties. Users with FINANCE or READ_ONLY roles will not see the delete button.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Tips */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Tips</h2>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">1.</span>
            <span>Use descriptive names for your properties to easily identify them in the calendar view.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">2.</span>
            <span>If a property has zero bookings, check that the iCal URL is correct and try syncing again.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#669bbc] font-bold">3.</span>
            <span>Properties from different platforms are kept separate to avoid conflicts.</span>
          </li>
        </ul>
      </section>

      {/* Next Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Next Steps</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/docs/calendar">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Calendar View</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  View all your property bookings in a unified calendar.
                </p>
                <span className="text-sm font-medium text-primary flex items-center">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/integrations">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Integrations</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Learn how to add more properties via integrations.
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
