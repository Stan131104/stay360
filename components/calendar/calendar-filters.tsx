'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Property {
  id: string
  name: string
}

interface CalendarFiltersProps {
  properties: Property[]
  selectedPropertyId: string | null
  onPropertyChange: (propertyId: string | null) => void
}

export function CalendarFilters({
  properties,
  selectedPropertyId,
  onPropertyChange,
}: CalendarFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Property Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Property:</span>
        <Select
          value={selectedPropertyId || 'all'}
          onValueChange={(value) => onPropertyChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Legend */}
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-sm text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-xs">Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-xs">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span className="text-xs">Blocked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-xs">Cancelled</span>
        </div>
      </div>
    </div>
  )
}
