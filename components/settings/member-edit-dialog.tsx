'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Loader2, MoreVertical, Trash2 } from 'lucide-react'

interface Member {
  id: string
  role: string
  user_id: string
  email?: string
  created_at: string
}

interface MemberEditDialogProps {
  member: Member
  currentUserRole: string
  onUpdateRole: (memberId: string, newRole: string) => Promise<void>
  onRemove: (memberId: string) => Promise<void>
}

const roles = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'READ_ONLY', label: 'Read Only' },
]

export function MemberEditDialog({
  member,
  currentUserRole,
  onUpdateRole,
  onRemove,
}: MemberEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(member.role)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const canEdit = currentUserRole === 'OWNER' && member.role !== 'OWNER'

  const handleSave = async () => {
    if (role === member.role) {
      setOpen(false)
      return
    }

    setSaving(true)
    try {
      await onUpdateRole(member.id, role)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await onRemove(member.id)
      setOpen(false)
    } finally {
      setRemoving(false)
      setConfirmRemove(false)
    }
  }

  if (!canEdit) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setConfirmRemove(false)
        setRole(member.role)
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Change role or remove {member.email || `User ${member.user_id.slice(0, 8)}...`}
          </DialogDescription>
        </DialogHeader>

        {confirmRemove ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-destructive/10 p-4 text-center">
              <Trash2 className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-medium">
                Remove this member?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                They will lose access to this workspace immediately.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmRemove(false)}
                disabled={removing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={removing}
              >
                {removing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Remove Member
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmRemove(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || role === member.role}>
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
