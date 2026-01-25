import { NextRequest, NextResponse } from 'next/server'
import { runSync } from '@/lib/sync'
import { requireActiveTenant } from '@/lib/tenancy'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get active tenant
    const { tenant } = await requireActiveTenant()

    // Parse request body
    const body = await request.json()
    const { integrationId } = body

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId is required' },
        { status: 400 }
      )
    }

    // Verify user has permission (OWNER or MANAGER)
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Run sync
    const result = await runSync({
      integrationId,
      tenantId: tenant.id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, syncRunId: result.syncRunId },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      syncRunId: result.syncRunId,
      stats: result.stats,
    })
  } catch (error) {
    console.error('Sync error:', error)

    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'No tenant selected') {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
