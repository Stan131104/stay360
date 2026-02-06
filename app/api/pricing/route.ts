import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { NextRequest, NextResponse } from 'next/server'

// Update or create daily rates in bulk
export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()

    // Permission check - only OWNER, MANAGER, FINANCE can update pricing
    if (!['OWNER', 'MANAGER', 'FINANCE'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update pricing' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    const { propertyId, startDate, endDate, price, minNights, currency } = body

    if (!propertyId || !startDate || !endDate || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      )
    }

    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Generate all dates in the range
    const dates: string[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    // Limit to prevent abuse
    if (dates.length > 365) {
      return NextResponse.json(
        { error: 'Cannot update more than 365 days at once' },
        { status: 400 }
      )
    }

    // Upsert rates for each date
    // Unique constraint is: (tenant_id, property_id, date, source_provider)
    // Manual rates have null source_provider, so we use individual upserts
    const rates = dates.map(date => ({
      tenant_id: tenant.id,
      property_id: propertyId,
      date,
      price: price,
      min_nights: minNights || 1,
      currency: currency || 'USD',
      source_provider: null,
    }))

    // Insert in batches to avoid payload limits
    const batchSize = 50
    for (let i = 0; i < rates.length; i += batchSize) {
      const batch = rates.slice(i, i + batchSize)

      // For each rate, try to update first, then insert
      for (const rate of batch) {
        const { data: existing } = await supabase
          .from('daily_rates')
          .select('id')
          .eq('tenant_id', rate.tenant_id)
          .eq('property_id', rate.property_id)
          .eq('date', rate.date)
          .is('source_provider', null)
          .single()

        if (existing) {
          await supabase
            .from('daily_rates')
            .update({ price: rate.price, min_nights: rate.min_nights, currency: rate.currency })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('daily_rates')
            .insert(rate)
        }
      }
    }

    return NextResponse.json({ success: true, count: dates.length })
  } catch (error) {
    console.error('Error in POST /api/pricing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update a single rate
export async function PATCH(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()

    // Permission check
    if (!['OWNER', 'MANAGER', 'FINANCE'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update pricing' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    const { rateId, price, minNights } = body

    if (!rateId || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { price }
    if (minNights !== undefined) {
      updateData.min_nights = minNights
    }

    const { error } = await supabase
      .from('daily_rates')
      .update(updateData)
      .eq('id', rateId)
      .eq('tenant_id', tenant.id)

    if (error) {
      console.error('Error updating rate:', error)
      return NextResponse.json(
        { error: 'Failed to update rate' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/pricing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
