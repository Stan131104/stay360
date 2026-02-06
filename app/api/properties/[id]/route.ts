import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { id } = await params

    // Verify permission
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // First verify the property belongs to this tenant
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (fetchError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Delete associated bookings first
    await supabase
      .from('bookings')
      .delete()
      .eq('property_id', id)
      .eq('tenant_id', tenant.id)

    // Delete associated daily rates
    await supabase
      .from('daily_rates')
      .delete()
      .eq('property_id', id)
      .eq('tenant_id', tenant.id)

    // Delete the property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete property error:', error)

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { id } = await params
    const supabase = await createClient()

    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        integration:integrations(name, provider),
        bookings:bookings(count)
      `)
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (error || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(property)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const { id } = await params

    // Verify permission
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const body = await request.json()

    // First verify the property belongs to this tenant
    const { data: existingProperty, error: fetchError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (fetchError || !existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Extract property fields vs details fields
    const {
      details,
      ...propertyFields
    } = body

    // Update the property
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({
        name: propertyFields.name,
        address: propertyFields.address,
        city: propertyFields.city,
        country: propertyFields.country,
        bedrooms: propertyFields.bedrooms,
        bathrooms: propertyFields.bathrooms,
        max_guests: propertyFields.max_guests,
        is_active: propertyFields.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Update or create property details if provided
    if (details) {
      // Check if details exist
      const { data: existingDetails } = await supabase
        .from('property_details')
        .select('id')
        .eq('property_id', id)
        .single()

      if (existingDetails) {
        // Update existing details
        await supabase
          .from('property_details')
          .update({
            description: details.description,
            property_type: details.property_type,
            check_in_time: details.check_in_time,
            check_out_time: details.check_out_time,
            min_nights: details.min_nights,
            max_nights: details.max_nights,
            house_rules: details.house_rules,
            cancellation_policy: details.cancellation_policy,
            instant_book_enabled: details.instant_book_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('property_id', id)
      } else {
        // Create new details
        await supabase
          .from('property_details')
          .insert({
            property_id: id,
            description: details.description,
            property_type: details.property_type,
            check_in_time: details.check_in_time,
            check_out_time: details.check_out_time,
            min_nights: details.min_nights,
            max_nights: details.max_nights,
            house_rules: details.house_rules,
            cancellation_policy: details.cancellation_policy,
            instant_book_enabled: details.instant_book_enabled,
          })
      }
    }

    return NextResponse.json(updatedProperty)
  } catch (error) {
    console.error('Update property error:', error)

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
