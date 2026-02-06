'use client'

import { useState } from 'react'
import { PropertyFilters } from '@/components/properties/property-filters'
import { PropertyCard } from '@/components/properties/property-card'
import { cn } from '@/lib/utils'

interface Property {
  id: string
  name: string
  address: string | null
  city: string | null
  country: string | null
  bedrooms: number | null
  bathrooms: number | null
  max_guests: number | null
  source_provider: string | null
  is_active?: boolean
  thumbnail_url?: string | null
  listing_url?: string | null
  integration: { name: string; provider: string } | null
}

interface PropertiesClientProps {
  properties: Property[]
  providers: string[]
  canManage: boolean
}

export function PropertiesClient({ properties, providers, canManage }: PropertiesClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="space-y-4">
      <PropertyFilters
        providers={providers}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{properties.length} {properties.length === 1 ? 'property' : 'properties'}</span>
      </div>

      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
            : 'space-y-3'
        )}
      >
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            canDelete={canManage}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  )
}
