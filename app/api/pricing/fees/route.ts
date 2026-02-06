import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { NextRequest, NextResponse } from 'next/server'

// Create a new fee
export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()
    const body = await request.json()

    const {
      property_id,
      fee_type,
      name,
      amount,
      currency,
      is_percentage,
      per_night,
      is_mandatory,
    } = body

    if (!property_id || !fee_type || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('property_fees')
      .insert({
        tenant_id: tenant.id,
        property_id,
        fee_type,
        name,
        amount,
        currency: currency || 'USD',
        is_percentage: is_percentage || false,
        per_night: per_night || false,
        is_mandatory: is_mandatory !== false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating fee:', error)
      return NextResponse.json(
        { error: 'Failed to create fee' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/pricing/fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a fee
export async function DELETE(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const feeId = searchParams.get('id')

    if (!feeId) {
      return NextResponse.json(
        { error: 'Missing fee ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('property_fees')
      .delete()
      .eq('id', feeId)
      .eq('tenant_id', tenant.id)

    if (error) {
      console.error('Error deleting fee:', error)
      return NextResponse.json(
        { error: 'Failed to delete fee' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/pricing/fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
