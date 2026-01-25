-- ============================================================================
-- Stay360 Multi-Tenant Schema Migration
-- ============================================================================
-- This migration creates the complete multi-tenant architecture for Stay360
-- with Row Level Security (RLS) enforcing strict tenant isolation.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

-- Tenant membership roles
CREATE TYPE public.tenant_role AS ENUM (
  'OWNER',      -- Full access, can delete tenant, manage billing
  'MANAGER',    -- Can manage properties, bookings, integrations
  'FINANCE',    -- Read access + financial data, pricing management
  'READ_ONLY'   -- View-only access to all data
);

-- Integration provider types
CREATE TYPE public.integration_provider AS ENUM (
  'airbnb_ical',           -- iCal URL import from Airbnb
  'vrbo_ical',             -- iCal URL import from VRBO
  'booking_ical',          -- iCal URL import from Booking.com
  'generic_ical',          -- Generic iCal import
  'channel_manager_guesty', -- Guesty channel manager
  'channel_manager_hostaway', -- Hostaway channel manager
  'channel_manager_mock'   -- Mock provider for development
);

-- Integration status
CREATE TYPE public.integration_status AS ENUM (
  'pending',     -- Created but not yet synced
  'active',      -- Successfully syncing
  'error',       -- Last sync failed
  'disabled'     -- Manually disabled by user
);

-- Booking status
CREATE TYPE public.booking_status AS ENUM (
  'confirmed',   -- Confirmed reservation
  'pending',     -- Awaiting confirmation
  'cancelled',   -- Cancelled booking
  'blocked'      -- Owner block / unavailable
);

-- Sync run status
CREATE TYPE public.sync_status AS ENUM (
  'running',
  'completed',
  'failed'
);

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

-- Tenants (workspaces)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for slug lookups
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- Tenant memberships (links users to tenants with roles)
CREATE TABLE public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.tenant_role NOT NULL DEFAULT 'READ_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- Indexes for membership lookups
CREATE INDEX idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);
CREATE INDEX idx_tenant_memberships_user ON public.tenant_memberships(user_id);

-- Integrations (data source connections)
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider public.integration_provider NOT NULL,
  status public.integration_status NOT NULL DEFAULT 'pending',
  -- Configuration stored as JSONB (URLs, settings, etc.)
  config JSONB NOT NULL DEFAULT '{}',
  -- Encrypted credentials placeholder
  -- In production: use Supabase Vault or external secrets manager
  -- For now: store encrypted blob, decrypt in application layer with env key
  credentials_encrypted TEXT,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for tenant lookups
CREATE INDEX idx_integrations_tenant ON public.integrations(tenant_id);

-- Properties (rental listings)
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  -- External ID from provider (for deduplication)
  source_provider public.integration_provider,
  provider_property_id TEXT,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  max_guests INTEGER,
  -- Property metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique constraint for idempotent upserts from providers
  UNIQUE(tenant_id, source_provider, provider_property_id)
);

-- Indexes for property lookups
CREATE INDEX idx_properties_tenant ON public.properties(tenant_id);
CREATE INDEX idx_properties_integration ON public.properties(integration_id);

-- Bookings (reservations and blocks)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  -- External ID from provider (for deduplication)
  source_provider public.integration_provider,
  provider_booking_id TEXT,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  -- Dates
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  -- Guest info (if available)
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  num_guests INTEGER,
  -- Financial (if available from channel manager)
  total_price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  -- Notes/metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique constraint for idempotent upserts
  UNIQUE(tenant_id, source_provider, provider_booking_id),
  -- Ensure check_out is after check_in
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Indexes for booking lookups
CREATE INDEX idx_bookings_tenant ON public.bookings(tenant_id);
CREATE INDEX idx_bookings_property ON public.bookings(property_id);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX idx_bookings_integration ON public.bookings(integration_id);

-- Daily rates (pricing per property per date)
CREATE TABLE public.daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  source_provider public.integration_provider,
  date DATE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  min_nights INTEGER DEFAULT 1,
  currency TEXT DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One rate per property per date per source
  UNIQUE(tenant_id, property_id, date, source_provider)
);

-- Indexes for rate lookups
CREATE INDEX idx_daily_rates_tenant ON public.daily_rates(tenant_id);
CREATE INDEX idx_daily_rates_property_date ON public.daily_rates(property_id, date);

-- Sync runs (audit log of sync operations)
CREATE TABLE public.sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  status public.sync_status NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- Stats
  properties_synced INTEGER DEFAULT 0,
  bookings_synced INTEGER DEFAULT 0,
  rates_synced INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  -- Summary
  summary JSONB DEFAULT '{}'
);

-- Indexes for sync run lookups
CREATE INDEX idx_sync_runs_tenant ON public.sync_runs(tenant_id);
CREATE INDEX idx_sync_runs_integration ON public.sync_runs(integration_id);
CREATE INDEX idx_sync_runs_started ON public.sync_runs(started_at DESC);

-- Sync errors (detailed error log)
CREATE TABLE public.sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sync_run_id UUID NOT NULL REFERENCES public.sync_runs(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for error lookups
CREATE INDEX idx_sync_errors_sync_run ON public.sync_errors(sync_run_id);

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to get current user's ID (for RLS)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()
$$;

-- Function to check if user is member of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(check_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = check_tenant_id
    AND user_id = auth.uid()
  )
$$;

-- Function to check if user has specific role(s) in tenant
CREATE OR REPLACE FUNCTION public.has_tenant_role(check_tenant_id UUID, allowed_roles tenant_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = check_tenant_id
    AND user_id = auth.uid()
    AND role = ANY(allowed_roles)
  )
$$;

-- Function to get user's tenants (for tenant selection)
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  role tenant_role
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    t.id,
    t.name,
    t.slug,
    tm.role
  FROM public.tenants t
  JOIN public.tenant_memberships tm ON t.id = tm.tenant_id
  WHERE tm.user_id = auth.uid()
  ORDER BY t.name
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_errors ENABLE ROW LEVEL SECURITY;

-- TENANTS policies
-- Users can only see tenants they're members of
CREATE POLICY "Users can view their tenants"
  ON public.tenants FOR SELECT
  USING (public.is_tenant_member(id));

-- Only authenticated users can create tenants (they become owner)
CREATE POLICY "Authenticated users can create tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners can update tenant
CREATE POLICY "Owners can update tenant"
  ON public.tenants FOR UPDATE
  USING (public.has_tenant_role(id, ARRAY['OWNER'::tenant_role]));

-- Only owners can delete tenant
CREATE POLICY "Owners can delete tenant"
  ON public.tenants FOR DELETE
  USING (public.has_tenant_role(id, ARRAY['OWNER'::tenant_role]));

-- TENANT_MEMBERSHIPS policies
-- Users can see memberships of their tenants
CREATE POLICY "Users can view memberships of their tenants"
  ON public.tenant_memberships FOR SELECT
  USING (public.is_tenant_member(tenant_id));

-- Users can insert their own membership (when creating tenant)
-- Or owners/managers can add members
CREATE POLICY "Users can create memberships"
  ON public.tenant_memberships FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role])
  );

-- Owners and managers can update memberships (but not their own to higher)
CREATE POLICY "Owners and managers can update memberships"
  ON public.tenant_memberships FOR UPDATE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

-- Owners can delete memberships, users can remove themselves
CREATE POLICY "Owners can delete memberships"
  ON public.tenant_memberships FOR DELETE
  USING (
    user_id = auth.uid() OR
    public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role])
  );

-- INTEGRATIONS policies
CREATE POLICY "Members can view integrations"
  ON public.integrations FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Owners and managers can create integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

CREATE POLICY "Owners and managers can update integrations"
  ON public.integrations FOR UPDATE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

CREATE POLICY "Owners and managers can delete integrations"
  ON public.integrations FOR DELETE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

-- PROPERTIES policies
CREATE POLICY "Members can view properties"
  ON public.properties FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Owners and managers can create properties"
  ON public.properties FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

CREATE POLICY "Owners and managers can update properties"
  ON public.properties FOR UPDATE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

CREATE POLICY "Owners and managers can delete properties"
  ON public.properties FOR DELETE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

-- BOOKINGS policies
CREATE POLICY "Members can view bookings"
  ON public.bookings FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Owners and managers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

CREATE POLICY "Owners and managers can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

CREATE POLICY "Owners and managers can delete bookings"
  ON public.bookings FOR DELETE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

-- DAILY_RATES policies
CREATE POLICY "Members can view rates"
  ON public.daily_rates FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Owners, managers, finance can manage rates"
  ON public.daily_rates FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role, 'FINANCE'::tenant_role]));

CREATE POLICY "Owners, managers, finance can update rates"
  ON public.daily_rates FOR UPDATE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role, 'FINANCE'::tenant_role]));

CREATE POLICY "Owners, managers, finance can delete rates"
  ON public.daily_rates FOR DELETE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role, 'FINANCE'::tenant_role]));

-- SYNC_RUNS policies
CREATE POLICY "Members can view sync runs"
  ON public.sync_runs FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Owners and managers can create sync runs"
  ON public.sync_runs FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

CREATE POLICY "Owners and managers can update sync runs"
  ON public.sync_runs FOR UPDATE
  USING (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

-- SYNC_ERRORS policies
CREATE POLICY "Members can view sync errors"
  ON public.sync_errors FOR SELECT
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "System can create sync errors"
  ON public.sync_errors FOR INSERT
  WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['OWNER'::tenant_role, 'MANAGER'::tenant_role]));

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tenant_memberships_updated_at
  BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_daily_rates_updated_at
  BEFORE UPDATE ON public.daily_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------

COMMENT ON TABLE public.tenants IS 'Workspaces/organizations in the multi-tenant system';
COMMENT ON TABLE public.tenant_memberships IS 'Links users to tenants with specific roles';
COMMENT ON TABLE public.integrations IS 'Data source connections (iCal, channel managers)';
COMMENT ON TABLE public.properties IS 'Rental properties/listings';
COMMENT ON TABLE public.bookings IS 'Reservations and blocked dates';
COMMENT ON TABLE public.daily_rates IS 'Pricing per property per date';
COMMENT ON TABLE public.sync_runs IS 'Audit log of sync operations';
COMMENT ON TABLE public.sync_errors IS 'Detailed error log for sync failures';

COMMENT ON COLUMN public.integrations.credentials_encrypted IS
  'Encrypted credentials blob. Encryption approach: Use AES-256-GCM with a key from ENCRYPTION_KEY env var.
   In production, consider Supabase Vault or AWS KMS for key management.
   Format: base64(iv + ciphertext + authTag)';
