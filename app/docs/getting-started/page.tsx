import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, CheckCircle, Info } from 'lucide-react'

export default function GettingStartedPage() {
  return (
    <div className="py-8 px-6 lg:px-12 max-w-4xl">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Getting Started</h1>
        <p className="text-lg text-muted-foreground">
          Learn how to set up your Stay360 account and start managing your rental properties.
        </p>
      </div>

      {/* Introduction */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Introduction</h2>
        <p className="text-muted-foreground mb-4">
          Stay360 is an all-in-one platform for property managers and hosts. It helps you:
        </p>
        <ul className="space-y-2 mb-6">
          {[
            'Centralize bookings from multiple platforms (Airbnb, VRBO, Booking.com)',
            'View all your properties and reservations in one calendar',
            'Collaborate with your team with role-based access',
            'Track sync status and resolve errors quickly',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-[#669bbc] shrink-0 mt-0.5" />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Create Account */}
      <section id="create-account" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Create an Account</h2>
        <p className="text-muted-foreground mb-4">
          You can create a Stay360 account using either email/password or Google authentication.
        </p>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Option 1: Email & Password</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the <Link href="/signup" className="text-primary hover:underline">Sign Up page</Link></li>
              <li>Enter your email address</li>
              <li>Create a password (minimum 6 characters)</li>
              <li>Click "Create account"</li>
              <li>Check your email for a confirmation link</li>
              <li>Click the link to verify your account</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Option 2: Google Sign-In</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the <Link href="/signup" className="text-primary hover:underline">Sign Up page</Link></li>
              <li>Click "Sign up with Google"</li>
              <li>Select your Google account</li>
              <li>Grant permissions when prompted</li>
              <li>You'll be automatically signed in</li>
            </ol>
          </CardContent>
        </Card>
      </section>

      {/* Create Workspace */}
      <section id="create-workspace" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">Create a Workspace</h2>
        <p className="text-muted-foreground mb-4">
          After signing up, you'll need to create a workspace. A workspace is your organization's
          container for properties, bookings, and team members.
        </p>

        <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
          <li>After signing in, you'll be redirected to the workspace creation page</li>
          <li>Enter a name for your workspace (e.g., "Beach Properties LLC")</li>
          <li>Select your default currency (USD, EUR, GBP, etc.)</li>
          <li>Click "Create Workspace"</li>
        </ol>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You can manage multiple workspaces if you have separate property portfolios.
            Switch between them from the dashboard.
          </AlertDescription>
        </Alert>
      </section>

      {/* User Roles */}
      <section id="user-roles" className="mb-12 scroll-mt-20">
        <h2 className="text-2xl font-semibold text-primary mb-4">User Roles</h2>
        <p className="text-muted-foreground mb-4">
          Stay360 supports four user roles with different permission levels:
        </p>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">OWNER</span>
                <span className="font-semibold">Full Access</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Create, edit, and delete workspace</li>
                <li>- Manage all integrations and properties</li>
                <li>- Invite and remove team members</li>
                <li>- Change member roles</li>
                <li>- Access all settings</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">MANAGER</span>
                <span className="font-semibold">Operational Access</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Add and manage integrations</li>
                <li>- View and manage properties</li>
                <li>- View and manage bookings</li>
                <li>- Trigger manual syncs</li>
                <li>- Cannot modify workspace settings</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">FINANCE</span>
                <span className="font-semibold">Financial Access</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- View all properties and bookings</li>
                <li>- Access pricing and rate information</li>
                <li>- View financial reports</li>
                <li>- Cannot manage integrations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">READ_ONLY</span>
                <span className="font-semibold">View Access</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- View all properties</li>
                <li>- View all bookings</li>
                <li>- View calendar</li>
                <li>- Cannot make any changes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-primary mb-4">Next Steps</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/docs/integrations">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Connect Integrations</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Learn how to connect your Airbnb, VRBO, or Booking.com calendars.
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
                <h3 className="font-semibold mb-2">View Your Calendar</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Understand how to navigate and use the calendar view.
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
