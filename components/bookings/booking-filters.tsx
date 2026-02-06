'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, Download } from 'lucide-react'

interface Property {
  id: string
  name: string
}

interface BookingFiltersProps {
  properties: Property[]
  totalCount: number
}

export function BookingFilters({ properties, totalCount }: BookingFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')

  const updateParams = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filters change
    if (key !== 'page') {
      params.delete('page')
    }
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams('search', search || null)
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/dashboard/bookings')
  }

  const hasFilters = searchParams.get('search') ||
    searchParams.get('status') ||
    searchParams.get('property') ||
    searchParams.get('startDate') ||
    searchParams.get('endDate')

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guest name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {/* Property filter */}
          <Select
            value={searchParams.get('property') || 'all'}
            onValueChange={(value) => updateParams('property', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Property" />
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

          {/* Status filter */}
          <Select
            value={searchParams.get('status') || 'all'}
            onValueChange={(value) => updateParams('status', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          {/* Date range filter */}
          <Select
            value={searchParams.get('dateRange') || 'all'}
            onValueChange={(value) => updateParams('dateRange', value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="today">Check-in Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={searchParams.get('sort') || 'check_in_desc'}
            onValueChange={(value) => updateParams('sort', value === 'check_in_desc' ? null : value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="check_in_desc">Check-in (Latest)</SelectItem>
              <SelectItem value="check_in_asc">Check-in (Earliest)</SelectItem>
              <SelectItem value="created_desc">Created (Latest)</SelectItem>
              <SelectItem value="total_desc">Price (High)</SelectItem>
              <SelectItem value="total_asc">Price (Low)</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalCount} {totalCount === 1 ? 'booking' : 'bookings'}</span>
      </div>
    </div>
  )
}
