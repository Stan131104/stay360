import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'
import { PropertyCard } from '@/components/properties/property-card'
import { PropertiesClient } from './properties-client'

interface SearchParams {
  search?: string
  provider?: string
  status?: string
  bedrooms?: string
  sort?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  // Build the query
  let query = supabase
    .from('properties')
    .select(`
      *,
      integration:integrations(name, provider)
    `)
    .eq('tenant_id', tenant.id)

  // Apply filters
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,city.ilike.%${params.search}%,address.ilike.%${params.search}%`)
  }

  if (params.provider && params.provider !== 'all') {
    query = query.eq('source_provider', params.provider)
  }

  if (params.status === 'active') {
    query = query.eq('is_active', true)
  } else if (params.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  if (params.bedrooms && params.bedrooms !== 'all') {
    const beds = parseInt(params.bedrooms)
    if (beds >= 4) {
      query = query.gte('bedrooms', 4)
    } else {
      query = query.eq('bedrooms', beds)
    }
  }

  // Apply sorting
  switch (params.sort) {
    case 'created':
      query = query.order('created_at', { ascending: false })
      break
    case 'bedrooms':
      query = query.order('bedrooms', { ascending: false, nullsFirst: false })
      break
    case 'location':
      query = query.order('city', { ascending: true, nullsFirst: false })
      break
    default:
      query = query.order('name', { ascending: true })
  }

  const { data: properties, error } = await query

  // Get unique providers for filter dropdown
  const { data: providers } = await supabase
    .from('properties')
    .select('source_provider')
    .eq('tenant_id', tenant.id)
    .not('source_provider', 'is', null)

  const uniqueProviders = [...new Set(providers?.map(p => p.source_provider).filter(Boolean))] as string[]

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
        <PropertiesClient
          properties={transformedProperties}
          providers={uniqueProviders}
          canManage={canManage}
        />
      )}
    </div>
  )
}
