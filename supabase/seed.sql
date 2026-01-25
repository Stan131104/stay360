-- ============================================================================
-- Stay360 Development Seed Data
-- ============================================================================
-- Run this after the migration to set up test data for local development.
--
-- Usage:
-- 1. First, sign up a user via the UI at /signup
-- 2. Get the user's ID from auth.users table
-- 3. Replace 'YOUR_USER_ID_HERE' below with the actual UUID
-- 4. Run this script: psql -f supabase/seed.sql
--
-- Or use Supabase Dashboard > SQL Editor
-- ============================================================================

-- Replace this with your actual user ID after signing up
-- You can find it by running: SELECT id, email FROM auth.users;
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace this!
  v_tenant_id UUID;
  v_integration_id UUID;
  v_property_1_id UUID;
  v_property_2_id UUID;
BEGIN
  -- Skip if placeholder not replaced
  IF v_user_id = 'YOUR_USER_ID_HERE'::UUID THEN
    RAISE NOTICE 'Please replace YOUR_USER_ID_HERE with an actual user ID';
    RETURN;
  END IF;

  -- Create a test tenant
  INSERT INTO public.tenants (id, name, slug)
  VALUES (gen_random_uuid(), 'Demo Vacation Rentals', 'demo-rentals')
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'Created tenant: %', v_tenant_id;

  -- Add user as owner
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 'OWNER');

  RAISE NOTICE 'Added user as owner';

  -- Create a mock integration
  INSERT INTO public.integrations (id, tenant_id, name, provider, status, config)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'Demo Channel Manager',
    'channel_manager_mock',
    'active',
    '{"sync_interval_minutes": 60}'::jsonb
  )
  RETURNING id INTO v_integration_id;

  RAISE NOTICE 'Created integration: %', v_integration_id;

  -- Create sample properties
  INSERT INTO public.properties (id, tenant_id, integration_id, source_provider, provider_property_id, name, address, city, country, bedrooms, bathrooms, max_guests)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_integration_id,
    'channel_manager_mock',
    'prop_001',
    'Oceanfront Beach House',
    '123 Coastal Highway',
    'Malibu',
    'USA',
    4,
    3,
    8
  )
  RETURNING id INTO v_property_1_id;

  INSERT INTO public.properties (id, tenant_id, integration_id, source_provider, provider_property_id, name, address, city, country, bedrooms, bathrooms, max_guests)
  VALUES (
    gen_random_uuid(),
    v_tenant_id,
    v_integration_id,
    'channel_manager_mock',
    'prop_002',
    'Downtown Loft',
    '456 Main Street, Unit 5A',
    'Los Angeles',
    'USA',
    2,
    1,
    4
  )
  RETURNING id INTO v_property_2_id;

  RAISE NOTICE 'Created properties: %, %', v_property_1_id, v_property_2_id;

  -- Create sample bookings
  INSERT INTO public.bookings (tenant_id, property_id, integration_id, source_provider, provider_booking_id, status, check_in, check_out, guest_name, guest_email, num_guests, total_price, currency)
  VALUES
    -- Past booking
    (v_tenant_id, v_property_1_id, v_integration_id, 'channel_manager_mock', 'book_001', 'confirmed', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', 'John Smith', 'john@example.com', 4, 750.00, 'USD'),
    -- Current booking
    (v_tenant_id, v_property_1_id, v_integration_id, 'channel_manager_mock', 'book_002', 'confirmed', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '3 days', 'Jane Doe', 'jane@example.com', 6, 1200.00, 'USD'),
    -- Upcoming booking
    (v_tenant_id, v_property_2_id, v_integration_id, 'channel_manager_mock', 'book_003', 'confirmed', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '8 days', 'Bob Wilson', 'bob@example.com', 2, 450.00, 'USD'),
    -- Owner block
    (v_tenant_id, v_property_1_id, v_integration_id, 'channel_manager_mock', 'book_004', 'blocked', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '17 days', NULL, NULL, NULL, NULL, 'USD');

  RAISE NOTICE 'Created sample bookings';

  -- Create sample daily rates for next 14 days
  INSERT INTO public.daily_rates (tenant_id, property_id, integration_id, source_provider, date, price, min_nights, currency)
  SELECT
    v_tenant_id,
    v_property_1_id,
    v_integration_id,
    'channel_manager_mock',
    CURRENT_DATE + (n || ' days')::interval,
    CASE
      WHEN EXTRACT(dow FROM CURRENT_DATE + (n || ' days')::interval) IN (0, 5, 6) THEN 299.00  -- Weekend
      ELSE 199.00  -- Weekday
    END,
    CASE
      WHEN EXTRACT(dow FROM CURRENT_DATE + (n || ' days')::interval) IN (0, 5, 6) THEN 2
      ELSE 1
    END,
    'USD'
  FROM generate_series(0, 13) n;

  INSERT INTO public.daily_rates (tenant_id, property_id, integration_id, source_provider, date, price, min_nights, currency)
  SELECT
    v_tenant_id,
    v_property_2_id,
    v_integration_id,
    'channel_manager_mock',
    CURRENT_DATE + (n || ' days')::interval,
    CASE
      WHEN EXTRACT(dow FROM CURRENT_DATE + (n || ' days')::interval) IN (0, 5, 6) THEN 189.00
      ELSE 149.00
    END,
    1,
    'USD'
  FROM generate_series(0, 13) n;

  RAISE NOTICE 'Created sample daily rates';

  -- Create a sample sync run
  INSERT INTO public.sync_runs (tenant_id, integration_id, status, started_at, completed_at, properties_synced, bookings_synced, rates_synced, errors_count, summary)
  VALUES (
    v_tenant_id,
    v_integration_id,
    'completed',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '59 minutes',
    2,
    4,
    28,
    0,
    '{"date_range": {"start": "' || (CURRENT_DATE - INTERVAL '6 months')::text || '", "end": "' || (CURRENT_DATE + INTERVAL '12 months')::text || '"}}'::jsonb
  );

  RAISE NOTICE 'Created sample sync run';
  RAISE NOTICE '✅ Seed completed successfully!';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;

END $$;
