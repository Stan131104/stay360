'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlatformCard } from '@/components/integrations/platform-card'
import {
  Calendar,
  Plug,
  Plus,
  Trash2,
  Loader2,
  Home,
  Building,
  Key,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

type Provider = 'airbnb_ical' | 'airbnb_api' | 'booking_api' | 'channel_manager_mock'

interface ICalProperty {
  name: string
  url: string
}

function ConnectPageContent() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [name, setName] = useState('')
  const [icalProperties, setIcalProperties] = useState<ICalProperty[]>([{ name: '', url: '' }])
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for OAuth callback errors
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const addIcalProperty = () => {
    setIcalProperties([...icalProperties, { name: '', url: '' }])
  }

  const removeIcalProperty = (index: number) => {
    setIcalProperties(icalProperties.filter((_, i) => i !== index))
  }

  const updateIcalProperty = (index: number, field: 'name' | 'url', value: string) => {
    const newProperties = [...icalProperties]
    newProperties[index][field] = value
    setIcalProperties(newProperties)
  }

  const handleOAuthConnect = async (provider: 'airbnb' | 'booking') => {
    if (!name.trim()) {
      setError('Please enter an integration name')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/integrations/oauth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate OAuth')
      }

      // Redirect to OAuth URL
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const validProperties = icalProperties.filter(p => p.url.trim())

      if (selectedProvider === 'airbnb_ical' && validProperties.length === 0) {
        throw new Error('Please add at least one iCal URL')
      }

      const config: Record<string, unknown> = {}

      if (selectedProvider === 'airbnb_ical') {
        config.ical_urls = validProperties.map(p => p.url)
        config.property_names = validProperties.map(p => p.name || undefined)
      } else if (selectedProvider === 'booking_api') {
        config.api_key = apiKey
      }

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          provider: selectedProvider,
          config,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create integration')
      }

      // Trigger initial sync
      const syncResponse = await fetch('/api/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: data.id }),
      })

      const syncData = await syncResponse.json()

      if (!syncResponse.ok) {
        console.warn('Sync failed:', syncData.error)
      }

      router.push('/dashboard?connected=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const renderProviderSetup = () => {
    switch (selectedProvider) {
      case 'airbnb_ical':
        return (
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Airbnb iCal Setup
              </CardTitle>
              <CardDescription>
                Import bookings using iCal URLs from your Airbnb calendar settings.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Integration name</Label>
                  <Input
                    id="name"
                    placeholder="My Airbnb Properties"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Properties</Label>
                  <p className="text-xs text-muted-foreground">
                    Find your iCal URL in Airbnb: Calendar → Availability → Export Calendar
                  </p>

                  {icalProperties.map((property, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Property {index + 1}</span>
                        {icalProperties.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeIcalProperty(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Property name (optional)"
                        value={property.name}
                        onChange={(e) => updateIcalProperty(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="https://www.airbnb.com/calendar/ical/..."
                        value={property.url}
                        onChange={(e) => updateIcalProperty(index, 'url', e.target.value)}
                        required={index === 0}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIcalProperty}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add another property
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !name.trim() || !icalProperties[0].url.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting & Syncing...
                    </>
                  ) : (
                    'Connect & Sync'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedProvider(null)
                    setError(null)
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </CardFooter>
            </form>
          </Card>
        )

      case 'airbnb_api':
        return (
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Airbnb API Connection
              </CardTitle>
              <CardDescription>
                Connect directly to Airbnb for full sync including properties, bookings, and pricing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Demo Mode:</strong> This uses a simulated Airbnb API. Real API access
                  requires Airbnb Partner status.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Integration name</Label>
                <Input
                  id="name"
                  placeholder="My Airbnb Account"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                className="w-full"
                onClick={() => handleOAuthConnect('airbnb')}
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect with Airbnb'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedProvider(null)
                  setError(null)
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </CardFooter>
          </Card>
        )

      case 'booking_api':
        return (
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Booking.com API Connection
              </CardTitle>
              <CardDescription>
                Connect to Booking.com for property and reservation sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Demo Mode:</strong> This uses a simulated Booking.com API.
                  Real API access requires a Connectivity Partner agreement.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Integration name</Label>
                <Input
                  id="name"
                  placeholder="My Booking.com Account"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key (Demo)</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter any value for demo"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  In demo mode, any value will work. Real API keys come from Booking.com Partner Portal.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                className="w-full"
                onClick={() => handleOAuthConnect('booking')}
                disabled={loading || !name.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Booking.com'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedProvider(null)
                  setError(null)
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </CardFooter>
          </Card>
        )

      case 'channel_manager_mock':
        return (
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Demo Channel Manager
              </CardTitle>
              <CardDescription>
                Create a demo integration with sample properties and bookings for testing.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">Instant Demo Setup</p>
                      <p className="mt-1">
                        Creates 3 sample properties and 10+ bookings for testing the full dashboard experience.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Integration name</Label>
                  <Input
                    id="name"
                    placeholder="Demo Properties"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !name.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Demo...
                    </>
                  ) : (
                    'Create Demo Integration'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedProvider(null)
                    setError(null)
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </CardFooter>
            </form>
          </Card>
        )

      default:
        return null
    }
  }

  // Provider selected - show setup form
  if (selectedProvider) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        {renderProviderSetup()}
      </div>
    )
  }

  // Selection screen
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Connect your data</h1>
          <p className="text-muted-foreground mt-2">
            Choose how you want to import your property and booking data
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2 max-w-lg mx-auto">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <PlatformCard
            name="Airbnb iCal"
            description="Import bookings from Airbnb using iCal calendar links"
            icon={<Calendar className="h-5 w-5" />}
            features={[
              '+ Free and simple setup',
              '+ Works immediately',
              '+ No API access required',
              '- Bookings only (no pricing data)',
              '- Manual property names',
            ]}
            onClick={() => setSelectedProvider('airbnb_ical')}
          />

          <PlatformCard
            name="Airbnb API"
            description="Full sync with properties, bookings, photos, and pricing"
            icon={<Home className="h-5 w-5" />}
            badge="Demo"
            badgeVariant="secondary"
            features={[
              '+ Complete property data',
              '+ Photos and amenities',
              '+ Real-time pricing sync',
              '+ Two-way sync capability',
            ]}
            onClick={() => setSelectedProvider('airbnb_api')}
          />

          <PlatformCard
            name="Booking.com API"
            description="Connect to Booking.com for reservations and property data"
            icon={<Building className="h-5 w-5" />}
            badge="Demo"
            badgeVariant="secondary"
            features={[
              '+ Property and room details',
              '+ Reservation sync',
              '+ Rate plan support',
              '+ Guest information',
            ]}
            onClick={() => setSelectedProvider('booking_api')}
          />

          <PlatformCard
            name="Demo Integration"
            description="Create sample data to explore the full dashboard"
            icon={<Plug className="h-5 w-5" />}
            badge="Recommended"
            badgeVariant="default"
            features={[
              '+ Instant setup',
              '+ Sample properties & bookings',
              '+ Full feature demonstration',
              '+ No external accounts needed',
            ]}
            onClick={() => setSelectedProvider('channel_manager_mock')}
          />
        </div>

        <div className="text-center space-y-2">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            Skip for now
          </Link>
          <p className="text-xs text-muted-foreground">
            You can always connect integrations later from Settings
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ConnectPageContent />
    </Suspense>
  )
}
