'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Loader2,
  Settings,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  provider: string
  status: string
  last_sync_at: string | null
  last_error: string | null
  config: Record<string, unknown>
}

interface IntegrationConfigProps {
  integration: Integration
  onSync: (integrationId: string) => Promise<void>
  onDelete: (integrationId: string) => Promise<void>
  onUpdateConfig: (integrationId: string, config: Record<string, unknown>) => Promise<void>
}

const syncIntervals = [
  { value: '15', label: 'Every 15 minutes' },
  { value: '30', label: 'Every 30 minutes' },
  { value: '60', label: 'Every hour' },
  { value: '360', label: 'Every 6 hours' },
  { value: '720', label: 'Every 12 hours' },
  { value: '1440', label: 'Every 24 hours' },
]

export function IntegrationConfig({
  integration,
  onSync,
  onDelete,
  onUpdateConfig,
}: IntegrationConfigProps) {
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const config = integration.config || {}
  const [syncInterval, setSyncInterval] = useState(
    (config.sync_interval_minutes as string) || '60'
  )
  const [autoSync, setAutoSync] = useState(
    (config.auto_sync as boolean) !== false
  )
  const [syncBookings, setSyncBookings] = useState(
    (config.sync_bookings as boolean) !== false
  )
  const [syncPricing, setSyncPricing] = useState(
    (config.sync_pricing as boolean) ?? true
  )

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync(integration.id)
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(integration.id)
      setOpen(false)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      await onUpdateConfig(integration.id, {
        ...config,
        sync_interval_minutes: syncInterval,
        auto_sync: autoSync,
        sync_bookings: syncBookings,
        sync_pricing: syncPricing,
      })
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const providerLabel = integration.provider
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setConfirmDelete(false)
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{integration.name}</DialogTitle>
          <DialogDescription>
            {providerLabel} integration settings
          </DialogDescription>
        </DialogHeader>

        {confirmDelete ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-destructive/10 p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-medium">
                Delete this integration?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This will remove the integration and stop syncing data.
                Existing properties and bookings will be kept.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Integration
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Status</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current sync status
                  </p>
                </div>
                <Badge variant={
                  integration.status === 'active' ? 'default' :
                  integration.status === 'error' ? 'destructive' : 'secondary'
                }>
                  {integration.status}
                </Badge>
              </div>

              {/* Last sync */}
              {integration.last_sync_at && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Last Sync</Label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(integration.last_sync_at).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Last error */}
              {integration.last_error && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  {integration.last_error}
                </div>
              )}

              <div className="border-t pt-4 space-y-4">
                {/* Auto sync */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Sync</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically sync data on a schedule
                    </p>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>

                {/* Sync interval */}
                {autoSync && (
                  <div className="space-y-2">
                    <Label>Sync Interval</Label>
                    <Select value={syncInterval} onValueChange={setSyncInterval}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {syncIntervals.map((interval) => (
                          <SelectItem key={interval.value} value={interval.value}>
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Sync bookings */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sync Bookings</Label>
                    <p className="text-xs text-muted-foreground">
                      Import booking data
                    </p>
                  </div>
                  <Switch
                    checked={syncBookings}
                    onCheckedChange={setSyncBookings}
                  />
                </div>

                {/* Sync pricing */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sync Pricing</Label>
                    <p className="text-xs text-muted-foreground">
                      Import daily rates
                    </p>
                  </div>
                  <Switch
                    checked={syncPricing}
                    onCheckedChange={setSyncPricing}
                  />
                </div>
              </div>

              {/* Manual sync button */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Now
                </Button>
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
