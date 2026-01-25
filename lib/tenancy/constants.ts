// Tenant resolution constants

export const TENANT_COOKIE_NAME = 'stay360_tenant_id'
export const TENANT_QUERY_PARAM = 'tenant'
export const TENANT_HEADER_NAME = 'x-tenant-id'

// Cookie options
export const TENANT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
}
