import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'
import { WorkspaceSettingsForm } from '@/components/settings/workspace-settings-form'
import { SettingsClient } from './settings-client'

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    FINANCE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    READ_ONLY: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[role] || colors.READ_ONLY}`}>
      {role}
    </span>
  )
}

export default async function SettingsPage() {
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  const [
    { data: tenantData },
    { data: integrations },
    { data: members },
    { data: syncRuns },
  ] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, slug, default_currency')
      .eq('id', tenant.id)
      .single(),
    supabase
      .from('integrations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('tenant_memberships')
      .select('id, role, user_id, created_at')
      .eq('tenant_id', tenant.id),
    supabase
      .from('sync_runs')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('started_at', { ascending: false })
      .limit(10),
  ])

  const isOwner = tenant.role === 'OWNER'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace, integrations, and team
        </p>
      </div>

      {/* Workspace settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Workspace
          </CardTitle>
          <CardDescription>
            Manage your workspace name and default currency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WorkspaceSettingsForm
            tenant={{
              name: tenantData?.name || tenant.name,
              default_currency: tenantData?.default_currency,
            }}
            isOwner={isOwner}
          />
          <div className="pt-4 border-t">
            <label className="text-sm font-medium text-muted-foreground">Your Role</label>
            <p className="mt-1"><RoleBadge role={tenant.role} /></p>
          </div>
        </CardContent>
      </Card>

      {/* Interactive sections */}
      <SettingsClient
        tenantId={tenant.id}
        currentUserRole={tenant.role}
        members={(members || []).map(m => ({
          id: m.id,
          role: m.role,
          user_id: m.user_id,
          created_at: m.created_at,
        }))}
        integrations={(integrations || []).map(i => ({
          id: i.id,
          name: i.name,
          provider: i.provider,
          status: i.status,
          last_sync_at: i.last_sync_at,
          last_error: i.last_error,
          created_at: i.created_at,
          config: (i.config as Record<string, unknown>) || {},
        }))}
        syncRuns={(syncRuns || []).map(r => ({
          id: r.id,
          status: r.status,
          started_at: r.started_at,
          completed_at: r.completed_at,
          properties_synced: r.properties_synced,
          bookings_synced: r.bookings_synced,
          rates_synced: r.rates_synced,
          errors_count: r.errors_count,
        }))}
      />
    </div>
  )
}
