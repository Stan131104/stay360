'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Wifi,
  Car,
  Tv,
  Wind,
  UtensilsCrossed,
  Waves,
  Dumbbell,
  ShieldCheck,
  TreePine,
  Coffee,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'

interface Amenity {
  id: string
  name: string
  category: string
  icon: string | null
}

interface PropertyAmenitiesProps {
  amenities: Amenity[]
  className?: string
  showAll?: boolean
  maxVisible?: number
}

const categoryIcons: Record<string, React.ElementType> = {
  internet: Wifi,
  parking: Car,
  entertainment: Tv,
  heating_cooling: Wind,
  kitchen: UtensilsCrossed,
  outdoor: TreePine,
  services: Coffee,
  safety: ShieldCheck,
  pool_spa: Waves,
  fitness: Dumbbell,
  cleaning: Sparkles,
}

const categoryLabels: Record<string, string> = {
  internet: 'Internet',
  parking: 'Parking',
  entertainment: 'Entertainment',
  heating_cooling: 'Climate',
  kitchen: 'Kitchen',
  outdoor: 'Outdoor',
  services: 'Services',
  safety: 'Safety',
  pool_spa: 'Pool & Spa',
  fitness: 'Fitness',
  cleaning: 'Cleaning',
}

export function PropertyAmenities({
  amenities,
  className,
  showAll = false,
  maxVisible = 8,
}: PropertyAmenitiesProps) {
  // Group amenities by category
  const grouped = amenities.reduce((acc, amenity) => {
    const category = amenity.category || 'other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(amenity)
    return acc
  }, {} as Record<string, Amenity[]>)

  const visibleAmenities = showAll ? amenities : amenities.slice(0, maxVisible)
  const hiddenCount = amenities.length - maxVisible

  if (amenities.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No amenities listed
      </p>
    )
  }

  if (!showAll) {
    // Compact view - just badges
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {visibleAmenities.map((amenity) => {
          const IconComponent = categoryIcons[amenity.category] || CheckCircle2
          return (
            <Badge key={amenity.id} variant="secondary" className="gap-1">
              <IconComponent className="h-3 w-3" />
              {amenity.name}
            </Badge>
          )
        })}
        {hiddenCount > 0 && (
          <Badge variant="outline">+{hiddenCount} more</Badge>
        )}
      </div>
    )
  }

  // Full view - grouped by category
  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(grouped).map(([category, items]) => {
        const IconComponent = categoryIcons[category] || CheckCircle2
        const label = categoryLabels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <IconComponent className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium">{label}</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((amenity) => (
                <div key={amenity.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
