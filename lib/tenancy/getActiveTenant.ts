import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { TENANT_COOKIE_NAME } from './constants'
import type { TenantWithRole } from '@/lib/types/database'

export interface TenantContext {
  tenant: TenantWithRole | null
  tenants: TenantWithRole[]
  error?: string
}

/**
 * Get the active tenant for the current user.
 * Resolution order:
 * 1. Cookie (preferred)
 * 2. First available tenant (fallback)
 *
 * Returns null tenant if user has no tenant memberships.
 */
export async function getActiveTenant(): Promise<TenantContext> {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { tenant: null, tenants: [], error: 'Not authenticated' }
  }

  // Get all tenants user is member of
  const { data: userTenants, error: tenantsError } = await supabase
    .rpc('get_user_tenants')

  if (tenantsError) {
    console.error('Error fetching user tenants:', tenantsError)
    return { tenant: null, tenants: [], error: tenantsError.message }
  }

  if (!userTenants || userTenants.length === 0) {
    return { tenant: null, tenants: [] }
  }

  // Map to TenantWithRole
  const tenants: TenantWithRole[] = userTenants.map((t: {
    tenant_id: string
    tenant_name: string
    tenant_slug: string
    role: string
  }) => ({
    id: t.tenant_id,
    name: t.tenant_name,
    slug: t.tenant_slug,
    role: t.role as TenantWithRole['role'],
    created_at: '',
    updated_at: '',
  }))

  // Try to get tenant ID from cookie
  const cookieStore = await cookies()
  const tenantIdFromCookie = cookieStore.get(TENANT_COOKIE_NAME)?.value

  // Find active tenant
  let activeTenant: TenantWithRole | null = null

  if (tenantIdFromCookie) {
    activeTenant = tenants.find(t => t.id === tenantIdFromCookie) || null
  }

  // Fallback to first tenant if cookie tenant not found
  if (!activeTenant && tenants.length > 0) {
    activeTenant = tenants[0]
  }

  return { tenant: activeTenant, tenants }
}

/**
 * Get active tenant or throw if not found.
 * Use this in pages/actions that require a tenant.
 */
export async function requireActiveTenant(): Promise<{
  tenant: TenantWithRole
  tenants: TenantWithRole[]
}> {
  const context = await getActiveTenant()

  if (context.error) {
    throw new Error(context.error)
  }

  if (!context.tenant) {
    throw new Error('No tenant selected')
  }

  return { tenant: context.tenant, tenants: context.tenants }
}
