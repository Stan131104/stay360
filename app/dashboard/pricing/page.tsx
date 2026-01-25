import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'

export default async function PricingPage() {
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  // Get next 30 days of rates
  const today = new Date()
  const thirtyDaysLater = new Date(today)
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

  const { data: rates } = await supabase
    .from('daily_rates')
    .select(`
      id,
      date,
      price,
      min_nights,
      currency,
      property:properties(id, name)
    `)
    .eq('tenant_id', tenant.id)
    .gte('date', today.toISOString().split('T')[0])
    .lte('date', thirtyDaysLater.toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('property_id', { ascending: true })

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('tenant_id', tenant.id)
    .order('name', { ascending: true })

  // Group rates by property
  const ratesByProperty = new Map<string, typeof rates>()
  rates?.forEach(rate => {
    const propertyId = (rate.property as unknown as { id: string } | null)?.id
    if (!propertyId) return
    if (!ratesByProperty.has(propertyId)) {
      ratesByProperty.set(propertyId, [])
    }
    ratesByProperty.get(propertyId)!.push(rate)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground">
          View and manage daily rates for your properties
        </p>
      </div>

      {!properties || properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties yet</h3>
            <p className="text-sm text-muted-foreground">
              Connect an integration to import properties and pricing
            </p>
          </CardContent>
        </Card>
      ) : !rates || rates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No pricing data</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Pricing data is only available from channel manager integrations.
              iCal imports do not include pricing information.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {properties.map(property => {
            const propertyRates = ratesByProperty.get(property.id) || []

            if (propertyRates.length === 0) {
              return (
                <Card key={property.id}>
                  <CardHeader>
                    <CardTitle>{property.name}</CardTitle>
                    <CardDescription>No pricing data available</CardDescription>
                  </CardHeader>
                </Card>
              )
            }

            // Calculate stats
            const prices = propertyRates.map(r => r.price)
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)
            const currency = propertyRates[0]?.currency || 'USD'

            return (
              <Card key={property.id}>
                <CardHeader>
                  <CardTitle>{property.name}</CardTitle>
                  <CardDescription>
                    Next 30 days: {currency} {minPrice.toFixed(0)} - {maxPrice.toFixed(0)} (avg: {avgPrice.toFixed(0)})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-medium text-muted-foreground">Date</th>
                          <th className="py-2 text-right font-medium text-muted-foreground">Price</th>
                          <th className="py-2 text-right font-medium text-muted-foreground">Min Nights</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertyRates.slice(0, 14).map((rate: {
                          id: string
                          date: string
                          price: number
                          min_nights: number
                          currency: string
                        }) => (
                          <tr key={rate.id} className="border-b">
                            <td className="py-2">
                              {new Date(rate.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="py-2 text-right">
                              {rate.currency} {rate.price.toFixed(2)}
                            </td>
                            <td className="py-2 text-right text-muted-foreground">
                              {rate.min_nights}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {propertyRates.length > 14 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Showing 14 of {propertyRates.length} days
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
