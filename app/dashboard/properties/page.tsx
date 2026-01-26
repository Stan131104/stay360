import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'
import { PropertyCard } from '@/components/properties/property-card'

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

  const canManage = ['OWNER', 'MANAGER'].includes(tenant.role)

  // Transform properties to handle array relation
  const transformedProperties = properties?.map(property => ({
    ...property,
    integration: Array.isArray(property.integration) ? property.integration[0] || null : property.integration
  }))

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

      {!transformedProperties || transformedProperties.length === 0 ? (
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
          {transformedProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              canDelete={canManage}
            />
          ))}
        </div>
      )}
    </div>
  )
}
