import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Users, Plug, RefreshCw, Plus } from 'lucide-react'
import { WorkspaceSettingsForm } from '@/components/settings/workspace-settings-form'
import { IntegrationCard } from '@/components/settings/integration-card'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[status] || colors.pending}`}>
      {status}
    </span>
  )
}

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

  // Fetch full tenant data including currency
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
      .select(`
        id,
        role,
        user_id,
        created_at
      `)
      .eq('tenant_id', tenant.id),
    supabase
      .from('sync_runs')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('started_at', { ascending: false })
      .limit(10),
  ])

  const canManage = ['OWNER', 'MANAGER'].includes(tenant.role)
  const isOwner = tenant.role === 'OWNER'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace settings
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

      {/* Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Integrations
              </CardTitle>
              <CardDescription>Connected data sources</CardDescription>
            </div>
            {canManage && (
              <Link href="/onboarding/connect">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!integrations || integrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No integrations connected yet.
            </p>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration: {
                id: string
                name: string
                provider: string
                status: string
                last_sync_at: string | null
                last_error: string | null
                created_at: string
              }) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  canManage={canManage}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>People with access to this workspace</CardDescription>
            </div>
            {canManage && (
              <Button size="sm" variant="outline" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No team members found.
            </p>
          ) : (
            <div className="space-y-4">
              {members.map((member: {
                id: string
                role: string
                user_id: string
                created_at: string
              }) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">User {member.user_id.slice(0, 8)}...</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <RoleBadge role={member.role} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent sync runs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recent Sync Activity
          </CardTitle>
          <CardDescription>Latest synchronization runs</CardDescription>
        </CardHeader>
        <CardContent>
          {!syncRuns || syncRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sync activity yet.
            </p>
          ) : (
            <div className="space-y-4">
              {syncRuns.map((run: {
                id: string
                status: string
                started_at: string
                completed_at: string | null
                properties_synced: number
                bookings_synced: number
                rates_synced: number
                errors_count: number
              }) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm">
                      {new Date(run.started_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {run.properties_synced} properties, {run.bookings_synced} bookings
                      {run.errors_count > 0 && `, ${run.errors_count} errors`}
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      run.status === 'completed'
                        ? run.errors_count > 0
                          ? 'error'
                          : 'active'
                        : run.status
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
