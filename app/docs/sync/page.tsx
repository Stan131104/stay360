import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowRight, Info, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

export default function SyncPage() {
  return (
    <div className="py-8 px-6 lg:px-12 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Data Sync</h1>
        <p className="text-lg text-muted-foreground">
          Understand how Stay360 syncs your booking data and resolve common issues.
        </p>
      </div>

      {/* How Sync Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">How Sync Works</h2>
        <p className="text-muted-foreground mb-4">
          Stay360 fetches data from your connected integrations (iCal feeds) and imports it into your workspace.
          Here's the sync process:
        </p>

        <div className="space-y-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#669bbc] text-white text-sm font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold">Fetch Calendar Data</h3>
                <p className="text-sm text-muted-foreground">
                  Stay360 downloads the iCal feed from your booking platform.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#669bbc] text-white text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold">Parse Events</h3>
                <p className="text-sm text-muted-foreground">
                  Calendar events are parsed to extract booking information (dates, guest names, status).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#669bbc] text-white text-sm font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold">Upsert Properties</h3>
                <p className="text-sm text-muted-foreground">
                  Properties are created or updated based on the calendar metadata.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#669bbc] text-white text-sm font-bold shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold">Upsert Bookings</h3>
                <p className="text-sm text-muted-foreground">
                  Bookings are created or updated. Existing bookings are matched by their unique identifier.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#669bbc] text-white text-sm font-bold shrink-0">
                5
              </div>
              <div>
                <h3 className="font-semibold">Update Status</h3>
                <p className="text-sm text-muted-foreground">
                  The integration status is updated, and any errors are logged for review.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Sync is idempotent - running it multiple times with the same data won't create duplicates.
            Bookings are matched by their unique identifier from the source platform.
          </AlertDescription>
        </Alert>
      </section>

      {/* Manual Sync */}
      <section id="manual-sync" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Manual Sync</h2>
        <p className="text-muted-foreground mb-4">
          You can trigger a manual sync at any time to get the latest data:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
          <li>Go to <strong className="text-foreground">Dashboard</strong> &gt; <strong className="text-foreground">Settings</strong></li>
          <li>Find the integration you want to sync</li>
          <li>Click the <strong className="text-foreground">Sync</strong> button</li>
          <li>Wait for the sync to complete</li>
          <li>Check the sync status for any errors</li>
        </ol>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Sync Permissions</h3>
            <p className="text-sm text-muted-foreground">
              Only users with <span className="font-medium">OWNER</span> or <span className="font-medium">MANAGER</span> roles
              can trigger manual syncs.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Sync Errors */}
      <section id="sync-errors" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Sync Errors</h2>
        <p className="text-muted-foreground mb-4">
          When sync encounters issues, errors are logged and displayed in the dashboard.
          Here are common error types:
        </p>

        <div className="space-y-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-semibold">Invalid iCal URL</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The iCal URL is incorrect or has expired. Generate a new URL from your booking platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-semibold">Network Error</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Could not connect to the booking platform. Try again later or check if the platform is down.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="font-semibold">Parse Error</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The calendar data couldn't be parsed. The format may have changed or the data may be corrupted.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">Partial Sync</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Some bookings were synced but others failed. Check the error details for specific issues.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting */}
      <section id="troubleshooting" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Troubleshooting</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">My bookings aren't showing up</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Verify the iCal URL is correct and not expired</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Check that the integration status is "active"</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Try triggering a manual sync</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Check the sync activity for error messages</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Integration shows "error" status</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Check the last error message in Settings</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Generate a new iCal URL from your booking platform</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Delete and re-add the integration with the new URL</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Duplicate bookings appearing</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Check if you have multiple integrations for the same property</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Each property should only have one integration per platform</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Delete duplicate integrations to resolve</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Guest names not showing</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Not all platforms include guest names in iCal feeds</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>Airbnb includes guest names, but some platforms don't</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc] shrink-0 mt-0.5" />
                <span>This is a limitation of the iCal format, not Stay360</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Sync Activity */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Sync Activity</h2>
        <p className="text-muted-foreground mb-4">
          You can view recent sync activity in Settings. Each sync run shows:
        </p>

        <ul className="space-y-2 text-muted-foreground mb-6">
          <li className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[#669bbc]" />
            <span>Date and time of the sync</span>
          </li>
          <li className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[#669bbc]" />
            <span>Number of properties synced</span>
          </li>
          <li className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[#669bbc]" />
            <span>Number of bookings synced</span>
          </li>
          <li className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[#669bbc]" />
            <span>Error count (if any)</span>
          </li>
          <li className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-[#669bbc]" />
            <span>Sync status (running, completed, failed)</span>
          </li>
        </ul>
      </section>

      {/* Next Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Next Steps</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/docs/integrations">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Integrations</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Learn how to add and manage integrations.
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
                <h3 className="font-semibold mb-2">Calendar</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  View your synced bookings in the calendar.
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
