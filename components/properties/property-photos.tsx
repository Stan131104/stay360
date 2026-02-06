'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ImageIcon, X } from 'lucide-react'

interface Photo {
  id: string
  url: string
  thumbnail_url: string | null
  caption: string | null
  position: number
  is_primary: boolean
}

interface PropertyPhotosProps {
  photos: Photo[]
  propertyName: string
  className?: string
}

export function PropertyPhotos({ photos, propertyName, className }: PropertyPhotosProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return a.position - b.position
  })

  const selectedPhoto = sortedPhotos[selectedIndex]

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? sortedPhotos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === sortedPhotos.length - 1 ? 0 : prev + 1))
  }

  if (photos.length === 0) {
    return (
      <div className={cn('bg-muted rounded-lg flex items-center justify-center aspect-video', className)}>
        <div className="text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
          <p>No photos available</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* Main photo */}
        <div
          className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || propertyName}
            className="w-full h-full object-cover"
          />
          {sortedPhotos.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {selectedIndex + 1} / {sortedPhotos.length}
              </div>
            </>
          )}
          {selectedPhoto.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-sm">{selectedPhoto.caption}</p>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {sortedPhotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sortedPhotos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all',
                  index === selectedIndex
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent hover:border-muted-foreground/30'
                )}
              >
                <img
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              goToPrevious()
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <img
            src={selectedPhoto.url}
            alt={selectedPhoto.caption || propertyName}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            <p className="text-center">
              {selectedIndex + 1} / {sortedPhotos.length}
            </p>
            {selectedPhoto.caption && (
              <p className="text-sm text-white/80 mt-1">{selectedPhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
