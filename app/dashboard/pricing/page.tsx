import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { PricingClient } from './pricing-client'

export default async function PricingPage() {
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Get rates for current month and next month
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfNextMonth = new Date(currentYear, currentMonth + 2, 0)

  const [ratesResult, propertiesResult, rulesResult, feesResult] = await Promise.all([
    // Daily rates
    supabase
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
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfNextMonth.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('property_id', { ascending: true }),

    // Properties
    supabase
      .from('properties')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('name', { ascending: true }),

    // Pricing rules
    supabase
      .from('pricing_rules')
      .select(`
        id,
        property_id,
        rule_type,
        name,
        discount_percent,
        min_nights,
        start_date,
        end_date,
        property:properties(name)
      `)
      .eq('tenant_id', tenant.id)
      .order('property_id', { ascending: true }),

    // Property fees
    supabase
      .from('property_fees')
      .select(`
        id,
        property_id,
        fee_type,
        name,
        amount,
        currency,
        is_percentage,
        per_night,
        is_mandatory,
        property:properties(name)
      `)
      .eq('tenant_id', tenant.id)
      .order('property_id', { ascending: true }),
  ])

  // Transform the data to match expected types
  const rates = (ratesResult.data || []).map(rate => ({
    ...rate,
    property: rate.property as unknown as { id: string; name: string } | null,
  }))

  const properties = propertiesResult.data || []

  const rules = (rulesResult.data || []).map(rule => ({
    ...rule,
    property: rule.property as unknown as { name: string } | null,
  }))

  const fees = (feesResult.data || []).map(fee => ({
    ...fee,
    property: fee.property as unknown as { name: string } | null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="text-muted-foreground">
          Manage daily rates, pricing rules, and fees
        </p>
      </div>

      <PricingClient
        initialRates={rates}
        properties={properties}
        initialRules={rules}
        initialFees={fees}
        initialYear={currentYear}
        initialMonth={currentMonth}
      />
    </div>
  )
}
