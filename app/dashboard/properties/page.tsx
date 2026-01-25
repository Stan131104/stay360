import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, BedDouble, Bath } from 'lucide-react'

export default async function PropertiesPage() {
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      *,
      integration:integrations(name, provider),
      bookings:bookings(count)
    `)
    .eq('tenant_id', tenant.id)
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage your rental properties
          </p>
        </div>
        <Link href="/onboarding/connect">
          <Button>Add Property</Button>
        </Link>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading properties: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {!properties || properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect an integration to import your properties
            </p>
            <Link href="/onboarding/connect">
              <Button>Connect Integration</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property: {
            id: string
            name: string
            address: string | null
            city: string | null
            country: string | null
            bedrooms: number | null
            bathrooms: number | null
            max_guests: number | null
            source_provider: string | null
            integration: { name: string; provider: string } | null
          }) => (
            <Card key={property.id}>
              <CardHeader>
                <CardTitle className="text-lg">{property.name}</CardTitle>
                <CardDescription>
                  {[property.city, property.country].filter(Boolean).join(', ') || 'No location set'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                    <span>{property.bedrooms || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span>{property.bathrooms || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{property.max_guests || '-'}</span>
                  </div>
                </div>
                {property.integration && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Source: {property.integration.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
