import Link from 'next/link'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Rocket,
  Building2,
  Calendar,
  Plug,
  Users,
  RefreshCw,
  ChevronRight,
  Home,
} from 'lucide-react'

const navigation = [
  {
    title: 'Getting Started',
    icon: Rocket,
    href: '/docs/getting-started',
    items: [
      { title: 'Introduction', href: '/docs/getting-started' },
      { title: 'Create Account', href: '/docs/getting-started#create-account' },
      { title: 'Create Workspace', href: '/docs/getting-started#create-workspace' },
      { title: 'User Roles', href: '/docs/getting-started#user-roles' },
    ],
  },
  {
    title: 'Properties',
    icon: Building2,
    href: '/docs/properties',
    items: [
      { title: 'Overview', href: '/docs/properties' },
      { title: 'Adding Properties', href: '/docs/properties#adding-properties' },
      { title: 'Property Details', href: '/docs/properties#property-details' },
      { title: 'Deleting Properties', href: '/docs/properties#deleting-properties' },
    ],
  },
  {
    title: 'Calendar & Bookings',
    icon: Calendar,
    href: '/docs/calendar',
    items: [
      { title: 'Calendar View', href: '/docs/calendar' },
      { title: 'Booking Statuses', href: '/docs/calendar#booking-statuses' },
      { title: 'Navigation', href: '/docs/calendar#navigation' },
      { title: 'Bookings List', href: '/docs/calendar#bookings-list' },
    ],
  },
  {
    title: 'Integrations',
    icon: Plug,
    href: '/docs/integrations',
    items: [
      { title: 'Supported Platforms', href: '/docs/integrations' },
      { title: 'iCal Setup', href: '/docs/integrations#ical-setup' },
      { title: 'Airbnb', href: '/docs/integrations#airbnb' },
      { title: 'VRBO', href: '/docs/integrations#vrbo' },
      { title: 'Booking.com', href: '/docs/integrations#booking-com' },
      { title: 'Managing Integrations', href: '/docs/integrations#managing-integrations' },
    ],
  },
  {
    title: 'Team Management',
    icon: Users,
    href: '/docs/team',
    items: [
      { title: 'Overview', href: '/docs/team' },
      { title: 'Role Permissions', href: '/docs/team#role-permissions' },
      { title: 'Inviting Members', href: '/docs/team#inviting-members' },
    ],
  },
  {
    title: 'Data Sync',
    icon: RefreshCw,
    href: '/docs/sync',
    items: [
      { title: 'How Sync Works', href: '/docs/sync' },
      { title: 'Manual Sync', href: '/docs/sync#manual-sync' },
      { title: 'Sync Errors', href: '/docs/sync#sync-errors' },
      { title: 'Troubleshooting', href: '/docs/sync#troubleshooting' },
    ],
  },
]

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">Stay<span className="text-[#c1121f]">360</span></span>
            </Link>
            <nav className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
              <Link href="/docs" className="hover:text-primary">Documentation</Link>
            </nav>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/changelog" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Changelog
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r">
          <ScrollArea className="h-[calc(100vh-4rem)] py-6 pr-6 pl-4">
            <nav className="space-y-6">
              <Link
                href="/docs"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                <Home className="h-4 w-4" />
                Documentation Home
              </Link>
              {navigation.map((section) => (
                <div key={section.href}>
                  <Link
                    href={section.href}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <section.icon className="h-4 w-4 text-[#669bbc]" />
                    {section.title}
                  </Link>
                  <ul className="mt-2 space-y-1 border-l pl-4 ml-2">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="block text-sm text-muted-foreground hover:text-primary py-1"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
