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

    // Verify permission - only OWNER or MANAGER can delete
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // First verify the integration belongs to this tenant
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Get sync run IDs first
    const { data: syncRuns } = await supabase
      .from('sync_runs')
      .select('id')
      .eq('integration_id', id)
      .eq('tenant_id', tenant.id)

    // Delete associated sync errors
    if (syncRuns && syncRuns.length > 0) {
      const syncRunIds = syncRuns.map(sr => sr.id)
      await supabase
        .from('sync_errors')
        .delete()
        .in('sync_run_id', syncRunIds)
    }

    // Delete sync runs
    await supabase
      .from('sync_runs')
      .delete()
      .eq('integration_id', id)
      .eq('tenant_id', tenant.id)

    // Delete daily rates for properties from this integration
    await supabase
      .from('daily_rates')
      .delete()
      .eq('integration_id', id)
      .eq('tenant_id', tenant.id)

    // Delete bookings for properties from this integration
    await supabase
      .from('bookings')
      .delete()
      .eq('integration_id', id)
      .eq('tenant_id', tenant.id)

    // Delete properties from this integration
    await supabase
      .from('properties')
      .delete()
      .eq('integration_id', id)
      .eq('tenant_id', tenant.id)

    // Finally delete the integration
    const { error: deleteError } = await supabase
      .from('integrations')
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
    console.error('Delete integration error:', error)

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
