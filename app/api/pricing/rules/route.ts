import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { NextRequest, NextResponse } from 'next/server'

// Create a new pricing rule
export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()
    const body = await request.json()

    const { property_id, rule_type, name, discount_percent, min_nights, start_date, end_date } = body

    if (!property_id || !rule_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({
        tenant_id: tenant.id,
        property_id,
        rule_type,
        name,
        discount_percent,
        min_nights,
        start_date,
        end_date,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pricing rule:', error)
      return NextResponse.json(
        { error: 'Failed to create pricing rule' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/pricing/rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete a pricing rule
export async function DELETE(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('id')

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Missing rule ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId)
      .eq('tenant_id', tenant.id)

    if (error) {
      console.error('Error deleting pricing rule:', error)
      return NextResponse.json(
        { error: 'Failed to delete pricing rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/pricing/rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
