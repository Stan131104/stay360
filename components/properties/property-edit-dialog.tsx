'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Pencil, Loader2 } from 'lucide-react'

interface PropertyData {
  id: string
  name: string
  address: string | null
  city: string | null
  country: string | null
  bedrooms: number | null
  bathrooms: number | null
  max_guests: number | null
  is_active: boolean
  details?: {
    description: string | null
    property_type: string | null
    check_in_time: string | null
    check_out_time: string | null
    min_nights: number | null
    max_nights: number | null
    house_rules: string | null
    cancellation_policy: string | null
    instant_book_enabled: boolean | null
  } | null
}

interface PropertyEditDialogProps {
  property: PropertyData
  trigger?: React.ReactNode
}

export function PropertyEditDialog({ property, trigger }: PropertyEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: property.name,
    address: property.address || '',
    city: property.city || '',
    country: property.country || '',
    bedrooms: property.bedrooms?.toString() || '',
    bathrooms: property.bathrooms?.toString() || '',
    max_guests: property.max_guests?.toString() || '',
    is_active: property.is_active,
    description: property.details?.description || '',
    property_type: property.details?.property_type || '',
    check_in_time: property.details?.check_in_time || '15:00',
    check_out_time: property.details?.check_out_time || '11:00',
    min_nights: property.details?.min_nights?.toString() || '1',
    max_nights: property.details?.max_nights?.toString() || '30',
    house_rules: property.details?.house_rules || '',
    cancellation_policy: property.details?.cancellation_policy || '',
    instant_book_enabled: property.details?.instant_book_enabled ?? true,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          max_guests: formData.max_guests ? parseInt(formData.max_guests) : null,
          is_active: formData.is_active,
          details: {
            description: formData.description || null,
            property_type: formData.property_type || null,
            check_in_time: formData.check_in_time || null,
            check_out_time: formData.check_out_time || null,
            min_nights: formData.min_nights ? parseInt(formData.min_nights) : null,
            max_nights: formData.max_nights ? parseInt(formData.max_nights) : null,
            house_rules: formData.house_rules || null,
            cancellation_policy: formData.cancellation_policy || null,
            instant_book_enabled: formData.instant_book_enabled,
          },
        }),
      })

      if (response.ok) {
        setOpen(false)
        router.refresh()
      } else {
        const data = await response.json()
        console.error('Failed to update property:', data.error)
      }
    } catch (error) {
      console.error('Failed to update property:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Make changes to your property details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium">Basic Information</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => handleChange('property_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="cabin">Cabin</SelectItem>
                    <SelectItem value="cottage">Cottage</SelectItem>
                    <SelectItem value="hotel_room">Hotel Room</SelectItem>
                    <SelectItem value="resort">Resort</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-4">
            <h3 className="font-medium">Capacity</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange('bedrooms', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange('bathrooms', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_guests">Max Guests</Label>
                <Input
                  id="max_guests"
                  type="number"
                  min="1"
                  value={formData.max_guests}
                  onChange={(e) => handleChange('max_guests', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your property..."
            />
          </div>

          {/* Check-in/out & Stay Rules */}
          <div className="space-y-4">
            <h3 className="font-medium">Booking Rules</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="check_in_time">Check-in Time</Label>
                <Input
                  id="check_in_time"
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => handleChange('check_in_time', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_out_time">Check-out Time</Label>
                <Input
                  id="check_out_time"
                  type="time"
                  value={formData.check_out_time}
                  onChange={(e) => handleChange('check_out_time', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_nights">Minimum Nights</Label>
                <Input
                  id="min_nights"
                  type="number"
                  min="1"
                  value={formData.min_nights}
                  onChange={(e) => handleChange('min_nights', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_nights">Maximum Nights</Label>
                <Input
                  id="max_nights"
                  type="number"
                  min="1"
                  value={formData.max_nights}
                  onChange={(e) => handleChange('max_nights', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="font-medium">Policies</h3>
            <div className="space-y-2">
              <Label htmlFor="house_rules">House Rules</Label>
              <Textarea
                id="house_rules"
                rows={3}
                value={formData.house_rules}
                onChange={(e) => handleChange('house_rules', e.target.value)}
                placeholder="No smoking, no parties..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
              <Textarea
                id="cancellation_policy"
                rows={2}
                value={formData.cancellation_policy}
                onChange={(e) => handleChange('cancellation_policy', e.target.value)}
                placeholder="Free cancellation up to 48 hours before check-in..."
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Settings</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Instant Book</Label>
                <p className="text-sm text-muted-foreground">
                  Allow guests to book without approval
                </p>
              </div>
              <Switch
                checked={formData.instant_book_enabled}
                onCheckedChange={(checked) => handleChange('instant_book_enabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Listing</Label>
                <p className="text-sm text-muted-foreground">
                  Property is visible and bookable
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
