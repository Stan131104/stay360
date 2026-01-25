'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TENANT_COOKIE_NAME, TENANT_COOKIE_OPTIONS } from './constants'
import type { TenantInsert, TenantRole } from '@/lib/types/database'

/**
 * Set the active tenant via cookie
 */
export async function setActiveTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify user is member of this tenant
  const { data: membership, error } = await supabase
    .from('tenant_memberships')
    .select('id')
    .eq('tenant_id', tenantId)
    .single()

  if (error || !membership) {
    return { success: false, error: 'Not a member of this tenant' }
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(TENANT_COOKIE_NAME, tenantId, TENANT_COOKIE_OPTIONS)

  return { success: true }
}

/**
 * Clear active tenant cookie
 */
export async function clearActiveTenant(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TENANT_COOKIE_NAME)
}

/**
 * Create a new tenant (workspace) and set user as owner
 */
export async function createTenant(data: {
  name: string
  slug?: string
}): Promise<{ tenantId?: string; error?: string }> {
  const supabase = await createClient()

  // Generate slug from name if not provided
  const slug = data.slug || data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Create tenant and membership in one transaction using database function
  const { data: tenantId, error } = await supabase
    .rpc('create_tenant_with_owner', {
      tenant_name: data.name,
      tenant_slug: slug,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'A workspace with this name already exists' }
    }
    return { error: error.message }
  }

  // Set as active tenant
  const cookieStore = await cookies()
  cookieStore.set(TENANT_COOKIE_NAME, tenantId, TENANT_COOKIE_OPTIONS)

  return { tenantId }
}

/**
 * Switch to a different tenant and redirect
 */
export async function switchTenant(tenantId: string, redirectTo: string = '/dashboard'): Promise<void> {
  const result = await setActiveTenant(tenantId)

  if (!result.success) {
    throw new Error(result.error)
  }

  redirect(redirectTo)
}

/**
 * Invite a user to the tenant
 */
export async function inviteMember(
  _tenantId: string,
  _email: string,
  _role: TenantRole
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement email invitation system
  // For MVP, we'll just create membership if user exists

  // Find user by email (requires admin API or custom lookup)
  // For now, return not implemented
  return { success: false, error: 'Email invitations not yet implemented' }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  membershipId: string,
  newRole: TenantRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tenant_memberships')
    .update({ role: newRole })
    .eq('id', membershipId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Remove member from tenant
 */
export async function removeMember(
  membershipId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tenant_memberships')
    .delete()
    .eq('id', membershipId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
