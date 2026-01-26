import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Rocket,
  Sparkles,
  Bug,
  Wrench,
  ArrowLeft,
  Calendar,
} from 'lucide-react'

interface ChangelogEntry {
  version: string
  date: string
  title: string
  type: 'major' | 'minor' | 'patch'
  changes: {
    type: 'feature' | 'improvement' | 'fix' | 'breaking'
    description: string
  }[]
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2025-01-26',
    title: 'Initial Release',
    type: 'major',
    changes: [
      {
        type: 'feature',
        description: 'Multi-tenant workspace support with role-based access control',
      },
      {
        type: 'feature',
        description: 'iCal integration for Airbnb, VRBO, Booking.com, and generic feeds',
      },
      {
        type: 'feature',
        description: 'Unified calendar view with month/year navigation',
      },
      {
        type: 'feature',
        description: 'Property management with sync status tracking',
      },
      {
        type: 'feature',
        description: 'Booking list view with filtering and sorting',
      },
      {
        type: 'feature',
        description: 'Dashboard with key metrics and sync alerts',
      },
      {
        type: 'feature',
        description: 'Google OAuth authentication support',
      },
      {
        type: 'feature',
        description: 'Email/password authentication with email confirmation',
      },
      {
        type: 'feature',
        description: 'Workspace settings with currency configuration',
      },
      {
        type: 'feature',
        description: 'Integration management (add, sync, delete)',
      },
      {
        type: 'feature',
        description: 'Property deletion with cascade cleanup',
      },
      {
        type: 'feature',
        description: 'Comprehensive documentation and changelog',
      },
    ],
  },
  {
    version: '0.9.0',
    date: '2025-01-25',
    title: 'Beta Release',
    type: 'minor',
    changes: [
      {
        type: 'feature',
        description: 'Calendar view with booking visualization',
      },
      {
        type: 'feature',
        description: 'iCal sync engine with error handling',
      },
      {
        type: 'fix',
        description: 'Fixed date constraint violation for single-day iCal events',
      },
      {
        type: 'improvement',
        description: 'Added sync activity tracking in settings',
      },
      {
        type: 'improvement',
        description: 'Enhanced color scheme with Stay360 brand colors',
      },
    ],
  },
  {
    version: '0.8.0',
    date: '2025-01-24',
    title: 'Integration Framework',
    type: 'minor',
    changes: [
      {
        type: 'feature',
        description: 'Integration provider architecture with adapter pattern',
      },
      {
        type: 'feature',
        description: 'iCal provider with Airbnb, VRBO, Booking.com support',
      },
      {
        type: 'feature',
        description: 'Sync run tracking with detailed error logging',
      },
      {
        type: 'improvement',
        description: 'Database schema with proper indexes and constraints',
      },
    ],
  },
  {
    version: '0.7.0',
    date: '2025-01-23',
    title: 'Multi-Tenancy',
    type: 'minor',
    changes: [
      {
        type: 'feature',
        description: 'Multi-tenant workspace support',
      },
      {
        type: 'feature',
        description: 'Role-based access control (OWNER, MANAGER, FINANCE, READ_ONLY)',
      },
      {
        type: 'feature',
        description: 'Row Level Security policies for data isolation',
      },
      {
        type: 'feature',
        description: 'Workspace creation during onboarding',
      },
    ],
  },
  {
    version: '0.5.0',
    date: '2025-01-20',
    title: 'Dashboard & Properties',
    type: 'minor',
    changes: [
      {
        type: 'feature',
        description: 'Dashboard with property and booking counts',
      },
      {
        type: 'feature',
        description: 'Properties list view',
      },
      {
        type: 'feature',
        description: 'Bookings list view with status badges',
      },
      {
        type: 'feature',
        description: 'Settings page structure',
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2025-01-15',
    title: 'Project Setup',
    type: 'minor',
    changes: [
      {
        type: 'feature',
        description: 'Next.js 16 with App Router',
      },
      {
        type: 'feature',
        description: 'Supabase integration for auth and database',
      },
      {
        type: 'feature',
        description: 'shadcn/ui component library',
      },
      {
        type: 'feature',
        description: 'Landing page with hero, features, and pricing sections',
      },
      {
        type: 'feature',
        description: 'Authentication pages (login, signup, forgot password)',
      },
    ],
  },
]

function getChangeIcon(type: string) {
  switch (type) {
    case 'feature':
      return <Sparkles className="h-4 w-4 text-[#669bbc]" />
    case 'improvement':
      return <Wrench className="h-4 w-4 text-[#669bbc]" />
    case 'fix':
      return <Bug className="h-4 w-4 text-orange-500" />
    case 'breaking':
      return <Rocket className="h-4 w-4 text-[#c1121f]" />
    default:
      return <Sparkles className="h-4 w-4 text-[#669bbc]" />
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'feature':
      return 'New'
    case 'improvement':
      return 'Improved'
    case 'fix':
      return 'Fixed'
    case 'breaking':
      return 'Breaking'
    default:
      return type
  }
}

function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'feature':
      return 'default'
    case 'improvement':
      return 'secondary'
    case 'fix':
      return 'outline'
    case 'breaking':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function getVersionBadgeColor(type: string) {
  switch (type) {
    case 'major':
      return 'bg-[#c1121f] text-white'
    case 'minor':
      return 'bg-[#669bbc] text-white'
    case 'patch':
      return 'bg-gray-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Stay<span className="text-[#c1121f]">360</span></span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Documentation
            </Link>
            <Link href="/changelog" className="text-sm font-medium text-primary">
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
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">
            Changelog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay up to date with new features, improvements, and bug fixes in Stay360.
          </p>
        </div>
      </section>

      {/* Changelog */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-8">
            {changelog.map((entry, index) => (
              <Card key={entry.version} className={index === 0 ? 'border-[#669bbc] border-2' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${getVersionBadgeColor(entry.type)}`}>
                        v{entry.version}
                      </span>
                      <CardTitle className="text-xl">{entry.title}</CardTitle>
                      {index === 0 && (
                        <Badge variant="default" className="bg-[#c1121f]">Latest</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {entry.changes.map((change, changeIndex) => (
                      <li key={changeIndex} className="flex items-start gap-3">
                        {getChangeIcon(change.type)}
                        <div className="flex-1">
                          <Badge variant={getTypeBadgeVariant(change.type)} className="text-xs mr-2">
                            {getTypeLabel(change.type)}
                          </Badge>
                          <span className="text-sm text-foreground">{change.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Back to docs */}
          <div className="mt-12 text-center">
            <Link
              href="/docs"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documentation
            </Link>
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
