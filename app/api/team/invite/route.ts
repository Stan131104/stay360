import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Send a team invitation
export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireActiveTenant()
    const supabase = await createClient()

    // Only owners and managers can invite
    if (!['OWNER', 'MANAGER'].includes(tenant.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Managers can only invite roles below them
    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    const validRoles = ['MANAGER', 'FINANCE', 'READ_ONLY']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Managers can only invite FINANCE and READ_ONLY
    if (tenant.role === 'MANAGER' && role === 'MANAGER') {
      return NextResponse.json(
        { error: 'Managers cannot invite other managers' },
        { status: 403 }
      )
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Check if user with this email already exists in the workspace
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userWithEmail = existingUser?.users?.find(u => u.email === email)

    if (userWithEmail) {
      // Check if already a member
      const { data: existingMembership } = await supabase
        .from('tenant_memberships')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('user_id', userWithEmail.id)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: 'This user is already a member of this workspace' },
          { status: 400 }
        )
      }
    }

    // For now, generate an invite link
    // In a real app, you'd store the invite in a dedicated table and send an email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/signup?invite=${inviteToken}&tenant=${tenant.id}&role=${role}`

    return NextResponse.json({
      success: true,
      inviteLink,
      message: `Invitation created for ${email}`,
    })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
