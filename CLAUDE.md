# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start development server (defaults to port 3000, uses 3001 if occupied)
npm run build    # Production build with TypeScript checking
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Architecture Overview

Stay360 is a multi-tenant property management SaaS built with:
- **Next.js 16** App Router with Server Components
- **React 19** with Server Actions
- **Supabase** for auth (PKCE flow) and database
- **Tailwind CSS v4** with shadcn/ui components
- **Row Level Security (RLS)** for tenant isolation

### Multi-Tenancy Pattern

Tenant isolation uses Postgres RLS with helper functions:
- `is_tenant_member(tenant_id)` - checks if current user belongs to tenant
- `has_tenant_role(tenant_id, required_role)` - checks role hierarchy (OWNER > MANAGER > FINANCE > READ_ONLY)
- Cookie-based tenant resolution via `lib/tenancy/getActiveTenant.ts`
- All tables have `tenant_id` column with RLS policies

### Key Directories

```
app/
├── api/                 # API routes (integrations, sync, bookings, properties)
├── auth/callback/       # Supabase auth code exchange
├── dashboard/           # Protected tenant pages
├── onboarding/          # Workspace creation and integration connection
lib/
├── integrations/        # Provider adapters (iCal, channel manager)
├── sync/                # Sync orchestration (runSync.ts)
├── supabase/            # Supabase clients (client.ts, server.ts, proxy.ts)
├── tenancy/             # Tenant resolution and actions
├── types/               # TypeScript types mirroring Postgres schema
components/
├── ui/                  # shadcn/ui components
├── calendar/            # Calendar view with month/year navigation
├── properties/          # Property cards with delete functionality
├── settings/            # Workspace settings form
supabase/
├── migrations/          # SQL migrations (applied via Supabase MCP)
├── functions/           # Edge functions (Deno, excluded from tsconfig)
```

### Integration Provider Pattern

New integrations implement `ProviderAdapter` interface in `lib/integrations/providers/types.ts`:
- `initialize(integration)` - setup with credentials/config
- `testConnection()` - verify API access
- `listListings()` - fetch properties
- `listBookings(range)` - fetch bookings within date range
- `sync(range)` - full sync returning listings, bookings, rates, errors

Register providers via `registerProvider(name, factory)`.

### Database Schema

Key tables: `tenants`, `tenant_memberships`, `integrations`, `properties`, `bookings`, `daily_rates`, `sync_runs`, `sync_errors`

Types in `lib/types/database.ts` mirror the schema. Use `*Insert` types for inserts (omit auto-generated fields).

### Auth Flow

Uses Supabase PKCE flow:
1. `proxy.ts` (Next.js middleware equivalent) refreshes sessions
2. `/auth/callback` exchanges auth code for session
3. Protected routes use `requireActiveTenant()` which verifies auth and tenant access

### Supabase MCP

Use the Supabase MCP tools for database operations:
- `mcp__supabase__apply_migration` for DDL changes
- `mcp__supabase__execute_sql` for queries
- `mcp__supabase__list_tables` to see schema
- `mcp__supabase__get_logs` for debugging

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```
