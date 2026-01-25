# Stay360 MVP Setup Guide

## Overview

This document describes the multi-tenant property management MVP architecture and setup instructions.

## Architecture

### Multi-Tenancy Model

Stay360 uses a **shared database with tenant isolation**:

- All business tables include a `tenant_id` column
- Row Level Security (RLS) policies enforce data isolation at the database level
- Users can belong to multiple tenants with different roles

### Tenant Roles

| Role | Permissions |
|------|-------------|
| OWNER | Full access, can delete tenant, manage billing, all CRUD |
| MANAGER | Manage properties, bookings, integrations, team members |
| FINANCE | Read all + manage pricing/rates |
| READ_ONLY | View-only access to all data |

### Database Schema

```
tenants
├── tenant_memberships (links users to tenants with roles)
├── integrations (data source connections)
│   └── sync_runs (audit log)
│       └── sync_errors (error details)
├── properties (rental listings)
│   ├── bookings (reservations/blocks)
│   └── daily_rates (pricing per date)
```

## Setup Instructions

### 1. Apply Database Migration

Run the migration via Supabase MCP or Dashboard:

```sql
-- Copy contents of supabase/migrations/20250125000001_multi_tenant_schema.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 2. Configure Environment

The `.env.local` file should already have:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Create Test User & Tenant

1. Sign up at http://localhost:3000/signup
2. Confirm email (check Supabase Dashboard > Authentication > Users)
3. Create workspace at /onboarding/workspace
4. Connect integration at /onboarding/connect

### 5. (Optional) Load Seed Data

For pre-populated test data:

1. Get your user ID from Supabase Dashboard > Authentication > Users
2. Edit `supabase/seed.sql` and replace `YOUR_USER_ID_HERE`
3. Run the seed script in Supabase Dashboard > SQL Editor

## Integration Adapters

### iCal Import (Functional)

Parses iCal feeds from Airbnb, VRBO, Booking.com:

```typescript
// Supports:
// - Confirmed bookings (guest reservations)
// - Blocked dates (owner blocks)
// - Guest name extraction from summary

// Does NOT support:
// - Pricing data
// - Automatic property creation
```

**Finding iCal URLs:**
- Airbnb: Calendar > Availability > Export Calendar
- VRBO: Calendar > Import/Export > Export
- Booking.com: Calendar > Sync calendars > Export

### Channel Manager (Mock)

For development/testing, returns sample data:
- 3 properties with realistic details
- Past, current, and upcoming bookings
- 30 days of dynamic pricing (weekday/weekend rates)

## RLS Testing

### Verify Tenant Isolation

```sql
-- As user A (member of tenant 1):
SELECT * FROM properties;
-- Should only see tenant 1 properties

-- Try to access tenant 2 data:
SELECT * FROM properties WHERE tenant_id = 'tenant-2-id';
-- Should return empty (RLS blocks access)
```

### Test Role Permissions

```sql
-- As READ_ONLY user:
INSERT INTO properties (tenant_id, name) VALUES ('...', 'Test');
-- Should fail: permission denied

-- As MANAGER:
INSERT INTO properties (tenant_id, name) VALUES ('...', 'Test');
-- Should succeed
```

### RLS Policy Debug

```sql
-- Check if user is member of tenant
SELECT public.is_tenant_member('tenant-id-here');

-- Check user's role
SELECT public.has_tenant_role('tenant-id-here', ARRAY['OWNER', 'MANAGER']);

-- List user's tenants
SELECT * FROM public.get_user_tenants();
```

## Security Notes

### Credential Storage

Integration credentials (API keys) are stored in `credentials_encrypted`:

```typescript
// Current: Placeholder for encrypted blob
// Recommended production approach:

// Option 1: Supabase Vault (if available)
// Store secrets in vault, reference by ID

// Option 2: Application-layer encryption
// 1. Generate AES-256-GCM key, store in ENCRYPTION_KEY env var
// 2. Encrypt: iv (12 bytes) + ciphertext + authTag (16 bytes)
// 3. Store as base64 in credentials_encrypted
// 4. Decrypt in application layer before use

// Option 3: External secrets manager (AWS Secrets Manager, HashiCorp Vault)
// Store reference ID, fetch at runtime
```

### RLS Security Checklist

- [x] All tables have RLS enabled
- [x] All tables have tenant_id column
- [x] Policies use SECURITY DEFINER helper functions
- [x] No direct table access without policy check
- [x] Insert policies verify user has permission for tenant_id being inserted

### Common Vulnerabilities Prevented

1. **Cross-tenant data access**: RLS policies check membership
2. **Privilege escalation**: Role checks in policies
3. **Unauthorized modifications**: Write policies verify roles
4. **Data leakage via joins**: RLS applies to all queries

## Sync System

### Manual Sync

1. Go to /dashboard/settings
2. Click "Sync" button on integration
3. View results in sync activity section

### Scheduled Sync (Edge Function)

Deploy the scheduled sync function:

```bash
supabase functions deploy scheduled-sync
```

Set up cron job in Supabase Dashboard:

```sql
-- Enable pg_cron extension first
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly sync
SELECT cron.schedule(
  'sync-all-integrations',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'
  );
  $$
);
```

## File Structure

```
stay360/
├── app/
│   ├── api/
│   │   ├── integrations/route.ts    # CRUD integrations
│   │   └── sync/run/route.ts        # Trigger sync
│   ├── dashboard/
│   │   ├── layout.tsx               # Dashboard shell
│   │   ├── page.tsx                 # Overview
│   │   ├── properties/page.tsx
│   │   ├── bookings/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── pricing/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── sync-button.tsx      # Client component
│   └── onboarding/
│       ├── workspace/page.tsx       # Create tenant
│       └── connect/page.tsx         # Add integration
├── lib/
│   ├── tenancy/
│   │   ├── getActiveTenant.ts       # Resolve current tenant
│   │   ├── actions.ts               # Server actions
│   │   └── constants.ts
│   ├── integrations/providers/
│   │   ├── types.ts                 # Provider interface
│   │   ├── ical.ts                  # iCal parser
│   │   └── mockChannelManager.ts    # Dev stub
│   ├── sync/
│   │   └── runSync.ts               # Sync orchestration
│   └── types/
│       └── database.ts              # TypeScript types
└── supabase/
    ├── migrations/
    │   └── 20250125000001_multi_tenant_schema.sql
    ├── functions/
    │   └── scheduled-sync/index.ts
    └── seed.sql
```

## Next Steps

After MVP validation:

1. **Email invitations** - Invite team members by email
2. **Billing integration** - Stripe for subscriptions
3. **Real channel managers** - Guesty, Hostaway API integrations
4. **Advanced calendar** - Drag-and-drop, availability rules
5. **Reporting** - Revenue analytics, occupancy reports
6. **Mobile app** - React Native companion app
