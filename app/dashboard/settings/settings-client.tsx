'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TeamInviteDialog } from '@/components/settings/team-invite-dialog'
import { MemberEditDialog } from '@/components/settings/member-edit-dialog'
import { IntegrationConfig } from '@/components/settings/integration-config'
import {
  Users,
  Plug,
  RefreshCw,
  Settings,
  Shield,
} from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: string
  role: string
  user_id: string
  created_at: string
}

interface Integration {
  id: string
  name: string
  provider: string
  status: string
  last_sync_at: string | null
  last_error: string | null
  created_at: string
  config: Record<string, unknown>
}

interface SyncRun {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  properties_synced: number
  bookings_synced: number
  rates_synced: number
  errors_count: number
}

interface SettingsClientProps {
  tenantId: string
  currentUserRole: string
  members: Member[]
  integrations: Integration[]
  syncRuns: SyncRun[]
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'active' || status === 'completed' ? 'default'
    : status === 'error' || status === 'failed' ? 'destructive'
    : 'secondary'

  return <Badge variant={variant}>{status}</Badge>
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

export function SettingsClient({
  tenantId,
  currentUserRole,
  members: initialMembers,
  integrations: initialIntegrations,
  syncRuns,
}: SettingsClientProps) {
  const [members, setMembers] = useState(initialMembers)
  const [integrations, setIntegrations] = useState(initialIntegrations)
  const router = useRouter()

  const canManage = ['OWNER', 'MANAGER'].includes(currentUserRole)
  const isOwner = currentUserRole === 'OWNER'

  const handleInvite = async (email: string, role: string) => {
    const response = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send invite')
    }

    return { inviteLink: data.inviteLink }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    const response = await fetch(`/api/team/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to update role')
    }

    setMembers(prev =>
      prev.map(m => m.id === memberId ? { ...m, role: newRole } : m)
    )
  }

  const handleRemoveMember = async (memberId: string) => {
    const response = await fetch(`/api/team/${memberId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to remove member')
    }

    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  const handleSync = async (integrationId: string) => {
    const response = await fetch('/api/sync/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ integrationId }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to start sync')
    }

    router.refresh()
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    const response = await fetch(`/api/integrations/${integrationId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to delete integration')
    }

    setIntegrations(prev => prev.filter(i => i.id !== integrationId))
  }

  const handleUpdateIntegrationConfig = async (
    integrationId: string,
    config: Record<string, unknown>
  ) => {
    const response = await fetch(`/api/integrations/${integrationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to update config')
    }

    setIntegrations(prev =>
      prev.map(i => i.id === integrationId ? { ...i, config } : i)
    )
  }

  return (
    <div className="space-y-6">
      {/* Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Integrations
              </CardTitle>
              <CardDescription>Connected data sources and sync configuration</CardDescription>
            </div>
            {canManage && (
              <Link href="/onboarding/connect">
                <Button size="sm">
                  Add Integration
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                No integrations connected yet.
              </p>
              <Link href="/onboarding/connect">
                <Button variant="outline" size="sm">
                  Connect your first integration
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{integration.name}</p>
                      <StatusBadge status={integration.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {integration.provider.replace(/_/g, ' ')}
                      {integration.last_sync_at && (
                        <> &middot; Last sync: {new Date(integration.last_sync_at).toLocaleString()}</>
                      )}
                    </p>
                    {integration.last_error && (
                      <p className="text-xs text-destructive mt-1 truncate">
                        {integration.last_error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSync(integration.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {canManage && (
                      <IntegrationConfig
                        integration={integration}
                        onSync={handleSync}
                        onDelete={handleDeleteIntegration}
                        onUpdateConfig={handleUpdateIntegrationConfig}
                      />
                    )}
                  </div>
                </div>
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
              <CardDescription>
                {members.length} {members.length === 1 ? 'member' : 'members'} in this workspace
              </CardDescription>
            </div>
            {canManage && (
              <TeamInviteDialog
                tenantId={tenantId}
                onInvite={handleInvite}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No team members found.
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        User {member.user_id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={member.role} />
                    {isOwner && member.role !== 'OWNER' && (
                      <MemberEditDialog
                        member={member}
                        currentUserRole={currentUserRole}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Role legend */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">Role permissions:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div><RoleBadge role="OWNER" /> Full access</div>
              <div><RoleBadge role="MANAGER" /> Manage integrations & bookings</div>
              <div><RoleBadge role="FINANCE" /> View all data & reports</div>
              <div><RoleBadge role="READ_ONLY" /> View only</div>
            </div>
          </div>
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
          {syncRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sync activity yet.
            </p>
          ) : (
            <div className="space-y-3">
              {syncRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-sm">
                      {new Date(run.started_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {run.properties_synced} properties, {run.bookings_synced} bookings, {run.rates_synced} rates
                      {run.errors_count > 0 && (
                        <span className="text-destructive"> &middot; {run.errors_count} errors</span>
                      )}
                    </p>
                  </div>
                  <StatusBadge
                    status={
                      run.status === 'completed'
                        ? run.errors_count > 0 ? 'error' : 'completed'
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
