'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Banknote, Plus, Trash2, Loader2 } from 'lucide-react'

interface PropertyFee {
  id: string
  property_id: string
  fee_type: string
  name: string | null
  amount: number
  currency: string
  is_percentage: boolean
  per_night: boolean
  is_mandatory: boolean
  property?: { name: string } | null
}

interface Property {
  id: string
  name: string
}

interface FeeManagerProps {
  fees: PropertyFee[]
  properties: Property[]
  onAddFee: (fee: Omit<PropertyFee, 'id'>) => Promise<void>
  onDeleteFee: (feeId: string) => Promise<void>
}

const feeTypes = [
  { value: 'cleaning', label: 'Cleaning Fee' },
  { value: 'service', label: 'Service Fee' },
  { value: 'pet', label: 'Pet Fee' },
  { value: 'extra_guest', label: 'Extra Guest Fee' },
  { value: 'other', label: 'Other' },
]

const feeTypeLabels: Record<string, string> = {
  cleaning: 'Cleaning',
  service: 'Service',
  pet: 'Pet',
  extra_guest: 'Extra Guest',
  other: 'Other',
}

export function FeeManager({ fees, properties, onAddFee, onDeleteFee }: FeeManagerProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [propertyId, setPropertyId] = useState('')
  const [feeType, setFeeType] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [isPercentage, setIsPercentage] = useState(false)
  const [perNight, setPerNight] = useState(false)
  const [isMandatory, setIsMandatory] = useState(true)

  const resetForm = () => {
    setPropertyId('')
    setFeeType('')
    setName('')
    setAmount('')
    setCurrency('USD')
    setIsPercentage(false)
    setPerNight(false)
    setIsMandatory(true)
  }

  const handleAdd = async () => {
    if (!propertyId || !feeType || !amount) return

    setSaving(true)
    try {
      await onAddFee({
        property_id: propertyId,
        fee_type: feeType,
        name: name || null,
        amount: parseFloat(amount),
        currency,
        is_percentage: isPercentage,
        per_night: perNight,
        is_mandatory: isMandatory,
      })
      setOpen(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (feeId: string) => {
    setDeleting(feeId)
    try {
      await onDeleteFee(feeId)
    } finally {
      setDeleting(null)
    }
  }

  // Group fees by property
  const feesByProperty = new Map<string, PropertyFee[]>()
  fees.forEach(fee => {
    if (!feesByProperty.has(fee.property_id)) {
      feesByProperty.set(fee.property_id, [])
    }
    feesByProperty.get(fee.property_id)!.push(fee)
  })

  const formatAmount = (fee: PropertyFee) => {
    if (fee.is_percentage) {
      return `${fee.amount}%`
    }
    return `${fee.currency} ${fee.amount.toFixed(2)}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fees</CardTitle>
            <CardDescription>
              Cleaning, service, and other fees
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Fee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fee</DialogTitle>
                <DialogDescription>
                  Add a fee to a property
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Property</Label>
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

                <div className="grid gap-2">
                  <Label>Fee Type</Label>
                  <Select value={feeType} onValueChange={setFeeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Fee Name (optional)</Label>
                  <Input
                    placeholder="e.g., Deep Clean"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      placeholder="50.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Is Percentage</Label>
                      <p className="text-xs text-muted-foreground">
                        Fee is a % of total price
                      </p>
                    </div>
                    <Switch
                      checked={isPercentage}
                      onCheckedChange={setIsPercentage}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Per Night</Label>
                      <p className="text-xs text-muted-foreground">
                        Charged per night (vs. per stay)
                      </p>
                    </div>
                    <Switch
                      checked={perNight}
                      onCheckedChange={setPerNight}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mandatory</Label>
                      <p className="text-xs text-muted-foreground">
                        Fee is required for all bookings
                      </p>
                    </div>
                    <Switch
                      checked={isMandatory}
                      onCheckedChange={setIsMandatory}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={saving || !propertyId || !feeType || !amount}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Fee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {fees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Banknote className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No fees configured
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add cleaning, service, or other fees
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(feesByProperty.entries()).map(([propId, propFees]) => {
              const propertyName = propFees[0]?.property?.name || properties.find(p => p.id === propId)?.name || 'Unknown'
              return (
                <div key={propId} className="space-y-2">
                  <h4 className="text-sm font-medium">{propertyName}</h4>
                  <div className="grid gap-2">
                    {propFees.map((fee) => (
                      <div
                        key={fee.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">
                            {feeTypeLabels[fee.fee_type]}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">
                              {fee.name || feeTypeLabels[fee.fee_type]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatAmount(fee)}
                              {fee.per_night && ' per night'}
                              {fee.is_mandatory ? '' : ' (optional)'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatAmount(fee)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(fee.id)}
                            disabled={deleting === fee.id}
                          >
                            {deleting === fee.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
