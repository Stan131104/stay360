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
import { Percent, Plus, Trash2, Loader2 } from 'lucide-react'

interface PricingRule {
  id: string
  property_id: string
  rule_type: string
  name: string | null
  discount_percent: number | null
  min_nights: number | null
  start_date: string | null
  end_date: string | null
  property?: { name: string } | null
}

interface Property {
  id: string
  name: string
}

interface PricingRulesProps {
  rules: PricingRule[]
  properties: Property[]
  onAddRule: (rule: Omit<PricingRule, 'id'>) => Promise<void>
  onDeleteRule: (ruleId: string) => Promise<void>
}

const ruleTypes = [
  { value: 'weekly_discount', label: 'Weekly Discount', description: '7+ nights' },
  { value: 'monthly_discount', label: 'Monthly Discount', description: '28+ nights' },
  { value: 'seasonal', label: 'Seasonal Pricing', description: 'Date range adjustment' },
  { value: 'last_minute', label: 'Last Minute', description: 'Short notice discount' },
]

const ruleTypeLabels: Record<string, string> = {
  weekly_discount: 'Weekly',
  monthly_discount: 'Monthly',
  seasonal: 'Seasonal',
  last_minute: 'Last Minute',
}

const ruleTypeColors: Record<string, string> = {
  weekly_discount: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  monthly_discount: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  seasonal: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  last_minute: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export function PricingRules({ rules, properties, onAddRule, onDeleteRule }: PricingRulesProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [propertyId, setPropertyId] = useState('')
  const [ruleType, setRuleType] = useState('')
  const [name, setName] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [minNights, setMinNights] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const resetForm = () => {
    setPropertyId('')
    setRuleType('')
    setName('')
    setDiscountPercent('')
    setMinNights('')
    setStartDate('')
    setEndDate('')
  }

  const handleAdd = async () => {
    if (!propertyId || !ruleType) return

    setSaving(true)
    try {
      await onAddRule({
        property_id: propertyId,
        rule_type: ruleType,
        name: name || null,
        discount_percent: discountPercent ? parseFloat(discountPercent) : null,
        min_nights: minNights ? parseInt(minNights) : null,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      setOpen(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ruleId: string) => {
    setDeleting(ruleId)
    try {
      await onDeleteRule(ruleId)
    } finally {
      setDeleting(null)
    }
  }

  // Group rules by property
  const rulesByProperty = new Map<string, PricingRule[]>()
  rules.forEach(rule => {
    if (!rulesByProperty.has(rule.property_id)) {
      rulesByProperty.set(rule.property_id, [])
    }
    rulesByProperty.get(rule.property_id)!.push(rule)
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pricing Rules</CardTitle>
            <CardDescription>
              Discounts and special pricing adjustments
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Pricing Rule</DialogTitle>
                <DialogDescription>
                  Create a new pricing rule for a property
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
                  <Label>Rule Type</Label>
                  <Select value={ruleType} onValueChange={setRuleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Rule Name (optional)</Label>
                  <Input
                    placeholder="e.g., Summer Special"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Min Nights</Label>
                    <Input
                      type="number"
                      placeholder="7"
                      value={minNights}
                      onChange={(e) => setMinNights(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>

                {(ruleType === 'seasonal' || ruleType === 'last_minute') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={saving || !propertyId || !ruleType}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Percent className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No pricing rules configured
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add rules for discounts and special pricing
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(rulesByProperty.entries()).map(([propId, propRules]) => {
              const propertyName = propRules[0]?.property?.name || properties.find(p => p.id === propId)?.name || 'Unknown'
              return (
                <div key={propId} className="space-y-2">
                  <h4 className="text-sm font-medium">{propertyName}</h4>
                  <div className="space-y-2">
                    {propRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={ruleTypeColors[rule.rule_type]}>
                            {ruleTypeLabels[rule.rule_type]}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">
                              {rule.name || ruleTypeLabels[rule.rule_type]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rule.discount_percent && `${rule.discount_percent}% off`}
                              {rule.min_nights && ` · ${rule.min_nights}+ nights`}
                              {rule.start_date && rule.end_date && ` · ${rule.start_date} to ${rule.end_date}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          disabled={deleting === rule.id}
                        >
                          {deleting === rule.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
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
