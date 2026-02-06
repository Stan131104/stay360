'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { BedDouble, Bath, Users, Trash2, MoreVertical, ExternalLink, ImageIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PropertyCardProps {
  property: {
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
  canDelete?: boolean
  viewMode?: 'grid' | 'list'
}

export function PropertyCard({ property, canDelete = false, viewMode = 'grid' }: PropertyCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        console.error('Failed to delete property:', data.error)
      }
    } catch (error) {
      console.error('Failed to delete property:', error)
    } finally {
      setDeleting(false)
      setOpen(false)
    }
  }

  const ActionMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/properties/${property.id}`}>
            View Details
          </Link>
        </DropdownMenuItem>
        {property.listing_url && (
          <DropdownMenuItem asChild>
            <a href={property.listing_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Listing
            </a>
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete property
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete property?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{property.name}" and all associated bookings and rates.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (viewMode === 'list') {
    return (
      <Link href={`/dashboard/properties/${property.id}`}>
        <Card className="hover:bg-muted/50 transition-colors">
          <div className="flex items-center p-4 gap-4">
            {/* Thumbnail */}
            <div className="w-20 h-14 bg-muted rounded-md overflow-hidden flex-shrink-0">
              {property.thumbnail_url ? (
                <img
                  src={property.thumbnail_url}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{property.name}</h3>
                {property.is_active === false && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {[property.city, property.country].filter(Boolean).join(', ') || 'No location'}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" />
                <span>{property.bedrooms || '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms || '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{property.max_guests || '-'}</span>
              </div>
            </div>

            {/* Source */}
            {property.integration && (
              <Badge variant="outline" className="hidden md:flex">
                {property.integration.provider.replace(/_/g, ' ')}
              </Badge>
            )}

            {/* Actions */}
            {ActionMenu}
          </div>
        </Card>
      </Link>
    )
  }

  // Grid view
  return (
    <Link href={`/dashboard/properties/${property.id}`}>
      <Card className="hover:bg-muted/50 transition-colors h-full">
        {/* Thumbnail */}
        <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
          {property.thumbnail_url ? (
            <img
              src={property.thumbnail_url}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{property.name}</CardTitle>
              {property.is_active === false && (
                <Badge variant="secondary" className="flex-shrink-0">Inactive</Badge>
              )}
            </div>
            <CardDescription className="truncate">
              {[property.city, property.country].filter(Boolean).join(', ') || 'No location set'}
            </CardDescription>
          </div>
          {ActionMenu}
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
    </Link>
  )
}
