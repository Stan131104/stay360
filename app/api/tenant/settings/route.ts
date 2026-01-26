import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'

const VALID_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'MXN',
  'BRL', 'ZAR', 'SEK', 'NOK', 'DKK', 'NZD', 'SGD', 'HKD', 'THB', 'AED'
]

export async function PATCH(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()

    // Only owners can change settings
    if (tenant.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can change settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { default_currency, name } = body

    // Validate currency if provided
    if (default_currency && !VALID_CURRENCIES.includes(default_currency)) {
      return NextResponse.json(
        { error: 'Invalid currency code' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, string> = {}
    if (default_currency) updateData.default_currency = default_currency
    if (name) updateData.name = name

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenant.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update tenant settings error:', error)

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'No tenant selected') {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug, default_currency')
      .eq('id', tenant.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
