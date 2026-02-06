'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Edit, Loader2 } from 'lucide-react'

interface Property {
  id: string
  name: string
}

interface BulkRateDialogProps {
  properties: Property[]
  onSave: (data: {
    propertyId: string
    startDate: string
    endDate: string
    price: number
    minNights?: number
  }) => Promise<void>
}

export function BulkRateDialog({ properties, onSave }: BulkRateDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [propertyId, setPropertyId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [price, setPrice] = useState('')
  const [minNights, setMinNights] = useState('')

  const resetForm = () => {
    setPropertyId('')
    setStartDate('')
    setEndDate('')
    setPrice('')
    setMinNights('')
    setError(null)
  }

  const handleSave = async () => {
    if (!propertyId || !startDate || !endDate || !price) {
      setError('Please fill in all required fields')
      return
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Invalid price')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        propertyId,
        startDate,
        endDate,
        price: priceNum,
        minNights: minNights ? parseInt(minNights) : undefined,
      })
      setOpen(false)
      resetForm()
    } catch (err) {
      setError('Failed to update rates')
    } finally {
      setSaving(false)
    }
  }

  // Set default dates to today and 7 days from now
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Bulk Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Rate Update</DialogTitle>
          <DialogDescription>
            Update prices for a date range. This will create or update daily rates.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="property">Property *</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date *</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price per Night *</Label>
              <Input
                id="price"
                type="number"
                placeholder="150.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
                step={0.01}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min-nights">Min Nights</Label>
              <Input
                id="min-nights"
                type="number"
                placeholder="1"
                value={minNights}
                onChange={(e) => setMinNights(e.target.value)}
                min={1}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Rates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
