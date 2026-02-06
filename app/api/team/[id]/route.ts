import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { NextRequest, NextResponse } from 'next/server'

// Update a team member's role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()
    const { id } = await params

    // Only owners can change roles
    if (tenant.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can change roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = body

    const validRoles = ['MANAGER', 'FINANCE', 'READ_ONLY']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Can't change own role
    const { data: membership } = await supabase
      .from('tenant_memberships')
      .select('user_id')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (membership.user_id === user?.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('tenant_memberships')
      .update({ role })
      .eq('id', id)
      .eq('tenant_id', tenant.id)

    if (error) {
      console.error('Error updating role:', error)
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/team/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()
    const { id } = await params

    // Only owners can remove members
    if (tenant.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can remove members' },
        { status: 403 }
      )
    }

    // Can't remove yourself
    const { data: membership } = await supabase
      .from('tenant_memberships')
      .select('user_id, role')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (membership.user_id === user?.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      )
    }

    // Can't remove other owners
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('tenant_memberships')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenant.id)

    if (error) {
      console.error('Error removing member:', error)
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/team/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
