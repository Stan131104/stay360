'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { RateEditor } from '@/components/pricing/rate-editor'
import { BulkRateDialog } from '@/components/pricing/bulk-rate-dialog'
import { PricingRules } from '@/components/pricing/pricing-rules'
import { FeeManager } from '@/components/pricing/fee-manager'

interface Rate {
  id: string
  date: string
  price: number
  min_nights: number
  currency: string
  property: { id: string; name: string } | null
}

interface Property {
  id: string
  name: string
}

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

interface PricingClientProps {
  initialRates: Rate[]
  properties: Property[]
  initialRules: PricingRule[]
  initialFees: PropertyFee[]
  initialYear: number
  initialMonth: number
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function PricingClient({
  initialRates,
  properties,
  initialRules,
  initialFees,
  initialYear,
  initialMonth,
}: PricingClientProps) {
  const [rates, setRates] = useState<Rate[]>(initialRates)
  const [rules, setRules] = useState<PricingRule[]>(initialRules)
  const [fees, setFees] = useState<PropertyFee[]>(initialFees)
  const [currentYear, setCurrentYear] = useState(initialYear)
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRates = useCallback(async (year: number, month: number) => {
    setLoading(true)
    try {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)

      let url = `/api/bookings?type=rates&start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`
      if (selectedPropertyId) {
        url += `&property=${selectedPropertyId}`
      }

      // For now, rates are fetched server-side, so we'll just update UI
    } catch (error) {
      console.error('Failed to fetch rates:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedPropertyId])

  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1
    let newYear = currentYear

    if (newMonth < 0) {
      newMonth = 11
      newYear--
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  const goToNextMonth = () => {
    let newMonth = currentMonth + 1
    let newYear = currentYear

    if (newMonth > 11) {
      newMonth = 0
      newYear++
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
  }

  const handleRateSave = async (rateId: string, newPrice: number) => {
    const response = await fetch('/api/pricing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateId, price: newPrice }),
    })

    if (!response.ok) {
      throw new Error('Failed to save rate')
    }

    setRates(prev =>
      prev.map(r => r.id === rateId ? { ...r, price: newPrice } : r)
    )
  }

  const handleBulkRateSave = async (data: {
    propertyId: string
    startDate: string
    endDate: string
    price: number
    minNights?: number
  }) => {
    const response = await fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to save rates')
    }

    // Refresh the page to get updated rates
    window.location.reload()
  }

  const handleAddRule = async (rule: Omit<PricingRule, 'id'>) => {
    const response = await fetch('/api/pricing/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    })

    if (!response.ok) {
      throw new Error('Failed to add rule')
    }

    const newRule = await response.json()
    setRules(prev => [...prev, newRule])
  }

  const handleDeleteRule = async (ruleId: string) => {
    const response = await fetch(`/api/pricing/rules?id=${ruleId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete rule')
    }

    setRules(prev => prev.filter(r => r.id !== ruleId))
  }

  const handleAddFee = async (fee: Omit<PropertyFee, 'id'>) => {
    const response = await fetch('/api/pricing/fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fee),
    })

    if (!response.ok) {
      throw new Error('Failed to add fee')
    }

    const newFee = await response.json()
    setFees(prev => [...prev, newFee])
  }

  const handleDeleteFee = async (feeId: string) => {
    const response = await fetch(`/api/pricing/fees?id=${feeId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete fee')
    }

    setFees(prev => prev.filter(f => f.id !== feeId))
  }

  // Filter rates by month and property
  const filteredRates = rates.filter(rate => {
    const rateDate = new Date(rate.date)
    const matchesMonth = rateDate.getMonth() === currentMonth && rateDate.getFullYear() === currentYear
    const matchesProperty = !selectedPropertyId || rate.property?.id === selectedPropertyId
    return matchesMonth && matchesProperty
  })

  // Group rates by property
  const ratesByProperty = new Map<string, Rate[]>()
  filteredRates.forEach(rate => {
    const propertyId = rate.property?.id
    if (!propertyId) return
    if (!ratesByProperty.has(propertyId)) {
      ratesByProperty.set(propertyId, [])
    }
    ratesByProperty.get(propertyId)!.push(rate)
  })

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rates" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="rates">Daily Rates</TabsTrigger>
            <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select
              value={selectedPropertyId || 'all'}
              onValueChange={(v) => setSelectedPropertyId(v === 'all' ? null : v)}
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
        </div>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>{monthNames[currentMonth]} {currentYear}</CardTitle>
                  <CardDescription>
                    Click on any price to edit it inline
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <BulkRateDialog
                    properties={properties}
                    onSave={handleBulkRateSave}
                  />

                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!properties || properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No properties yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect an integration to import properties and pricing
                  </p>
                </div>
              ) : filteredRates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No rates for this month</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Use &quot;Bulk Update&quot; to add rates, or sync from a channel manager integration.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.from(ratesByProperty.entries()).map(([propertyId, propRates]) => {
                    const propertyName = propRates[0]?.property?.name || 'Unknown'

                    // Calculate stats
                    const prices = propRates.map(r => r.price)
                    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
                    const minPrice = Math.min(...prices)
                    const maxPrice = Math.max(...prices)
                    const currency = propRates[0]?.currency || 'USD'

                    // Create a map of date to rate
                    const rateByDate = new Map<number, Rate>()
                    propRates.forEach(rate => {
                      const day = new Date(rate.date).getDate()
                      rateByDate.set(day, rate)
                    })

                    return (
                      <div key={propertyId} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{propertyName}</h4>
                          <div className="text-sm text-muted-foreground">
                            {currency} {minPrice.toFixed(0)} - {maxPrice.toFixed(0)} (avg: {avgPrice.toFixed(0)})
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <div className="grid grid-cols-7 gap-1 min-w-[700px]">
                            {/* Header */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                                {day}
                              </div>
                            ))}

                            {/* Padding for first day */}
                            {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                              <div key={`pad-${i}`} className="h-16" />
                            ))}

                            {/* Days */}
                            {daysArray.map(day => {
                              const rate = rateByDate.get(day)
                              const isWeekend = [0, 6].includes(new Date(currentYear, currentMonth, day).getDay())

                              return (
                                <div
                                  key={day}
                                  className={`h-16 border rounded p-1 flex flex-col ${
                                    isWeekend ? 'bg-muted/30' : ''
                                  }`}
                                >
                                  <div className="text-xs text-muted-foreground">{day}</div>
                                  {rate ? (
                                    <div className="flex-1 flex items-center justify-center">
                                      <RateEditor
                                        rateId={rate.id}
                                        propertyId={propertyId}
                                        date={rate.date}
                                        initialPrice={rate.price}
                                        currency={rate.currency}
                                        minNights={rate.min_nights}
                                        onSave={handleRateSave}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                                      -
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <PricingRules
            rules={rules}
            properties={properties}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
          />
        </TabsContent>

        <TabsContent value="fees">
          <FeeManager
            fees={fees}
            properties={properties}
            onAddFee={handleAddFee}
            onDeleteFee={handleDeleteFee}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
