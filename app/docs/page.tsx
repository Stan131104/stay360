import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen,
  Rocket,
  Building2,
  Calendar,
  Plug,
  Users,
  Shield,
  RefreshCw,
  HelpCircle,
  ArrowRight
} from 'lucide-react'

const sections = [
  {
    title: 'Getting Started',
    description: 'Learn the basics and set up your account',
    icon: Rocket,
    href: '/docs/getting-started',
    color: 'text-[#669bbc]',
  },
  {
    title: 'Properties',
    description: 'Manage your rental properties',
    icon: Building2,
    href: '/docs/properties',
    color: 'text-[#669bbc]',
  },
  {
    title: 'Calendar & Bookings',
    description: 'View and manage reservations',
    icon: Calendar,
    href: '/docs/calendar',
    color: 'text-[#669bbc]',
  },
  {
    title: 'Integrations',
    description: 'Connect your booking platforms',
    icon: Plug,
    href: '/docs/integrations',
    color: 'text-[#669bbc]',
  },
  {
    title: 'Team Management',
    description: 'Collaborate with your team',
    icon: Users,
    href: '/docs/team',
    color: 'text-[#669bbc]',
  },
  {
    title: 'Data Sync',
    description: 'Understand how syncing works',
    icon: RefreshCw,
    href: '/docs/sync',
    color: 'text-[#669bbc]',
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Stay<span className="text-[#c1121f]">360</span></span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/docs" className="text-sm font-medium text-primary">
              Documentation
            </Link>
            <Link href="/changelog" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Changelog
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">
            Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Stay360. Learn how to manage your properties,
            sync bookings, and grow your rental business.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link key={section.href} href={section.href}>
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <section.icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {section.description}
                    </CardDescription>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary">
                      Learn more
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-primary mb-8">Quick Start Guide</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { step: 1, title: 'Create Account', desc: 'Sign up with email or Google' },
              { step: 2, title: 'Create Workspace', desc: 'Set up your organization' },
              { step: 3, title: 'Connect Integration', desc: 'Add your iCal feeds' },
              { step: 4, title: 'View Dashboard', desc: 'Manage all your properties' },
            ].map((item) => (
              <Card key={item.step} className="relative">
                <CardContent className="pt-6">
                  <div className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#c1121f] text-white text-sm font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-primary mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary">Frequently Asked Questions</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                q: 'What booking platforms are supported?',
                a: 'Stay360 supports any platform that provides iCal feeds, including Airbnb, VRBO, Booking.com, and more.',
              },
              {
                q: 'How often does data sync?',
                a: 'You can manually sync anytime. Automatic syncing runs periodically to keep your data up to date.',
              },
              {
                q: 'Can I manage multiple properties?',
                a: 'Yes! Add as many properties as you need. Each property can have multiple iCal sources.',
              },
              {
                q: 'Is my data secure?',
                a: 'All data is encrypted and stored securely. We use row-level security to ensure data isolation.',
              },
            ].map((faq, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Stay360. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/" className="hover:text-primary">Home</Link>
            <Link href="/docs" className="hover:text-primary">Documentation</Link>
            <Link href="/changelog" className="hover:text-primary">Changelog</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
