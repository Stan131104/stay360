'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plug, Plus, Trash2, Loader2 } from 'lucide-react'

type IntegrationType = 'ical' | 'channel_manager'

interface ICalProperty {
  name: string
  url: string
}

export default function ConnectPage() {
  const [integrationType, setIntegrationType] = useState<IntegrationType | null>(null)
  const [name, setName] = useState('')
  const [icalProperties, setIcalProperties] = useState<ICalProperty[]>([{ name: '', url: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Filter out empty entries
      const validProperties = icalProperties.filter(p => p.url.trim())

      if (integrationType === 'ical' && validProperties.length === 0) {
        throw new Error('Please add at least one iCal URL')
      }

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          provider: integrationType === 'ical' ? 'airbnb_ical' : 'channel_manager_mock',
          config: integrationType === 'ical'
            ? {
                ical_urls: validProperties.map(p => p.url),
                property_names: validProperties.map(p => p.name || undefined),
              }
            : {},
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
        // Integration created but sync failed - still redirect but with warning
        console.warn('Sync failed:', syncData.error)
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // Selection screen
  if (!integrationType) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Connect your data</h1>
            <p className="text-muted-foreground mt-2">
              Choose how you want to import your property and booking data
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setIntegrationType('ical')}
            >
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>iCal Import</CardTitle>
                <CardDescription>
                  Import bookings from Airbnb, VRBO, or Booking.com using iCal URLs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>+ Free and simple setup</li>
                  <li>+ Works with most platforms</li>
                  <li>- Bookings only (no pricing)</li>
                  <li>- Manual property setup</li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setIntegrationType('channel_manager')}
            >
              <CardHeader>
                <Plug className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Channel Manager</CardTitle>
                <CardDescription>
                  Connect via API for full sync including properties, bookings, and pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>+ Full data sync</li>
                  <li>+ Automatic property import</li>
                  <li>+ Real-time pricing</li>
                  <li>- Requires API access</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Skip for now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // iCal setup form
  if (integrationType === 'ical') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              iCal Import Setup
            </CardTitle>
            <CardDescription>
              Enter your iCal URLs from Airbnb, VRBO, or other platforms.
              Optionally name each property.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Integration name</Label>
                <Input
                  id="name"
                  placeholder="My Airbnb Calendar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Properties</Label>
                <p className="text-xs text-muted-foreground">
                  Add one iCal URL per property. Find these in your Airbnb/VRBO calendar settings.
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
                onClick={() => setIntegrationType(null)}
              >
                Back
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  // Channel manager setup form
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Channel Manager Setup
          </CardTitle>
          <CardDescription>
            Connect to a channel manager API (Demo mode)
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="rounded-md bg-muted p-4">
              <p className="text-sm">
                <strong>Demo Mode:</strong> This will create a mock integration with sample
                properties and bookings for testing purposes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Integration name</Label>
              <Input
                id="name"
                placeholder="My Channel Manager"
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
                  Connecting...
                </>
              ) : (
                'Connect Demo Integration'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIntegrationType(null)}
            >
              Back
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
