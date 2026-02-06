'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Separator } from '@/components/ui/separator'
import {
  Eye,
  Pencil,
  Loader2,
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  MessageSquare,
  ExternalLink,
  Building2,
} from 'lucide-react'

interface Payment {
  id: string
  status: string
  amount: number
  currency: string
  payment_method: string | null
  payment_date: string | null
}

interface GuestProfile {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  total_bookings: number
  average_rating: number | null
}

interface Booking {
  id: string
  check_in: string
  check_out: string
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  num_guests: number | null
  status: string
  total_price: number | null
  currency: string
  special_requests: string | null
  confirmation_code: string | null
  source_url: string | null
  notes: string | null
  property: { id: string; name: string } | null
  guest_profile?: GuestProfile | null
  payments?: Payment[]
}

interface BookingDetailDialogProps {
  booking: Booking
  canEdit?: boolean
  trigger?: React.ReactNode
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  blocked: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

export function BookingDetailDialog({ booking, canEdit = false, trigger }: BookingDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    guest_name: booking.guest_name || '',
    guest_email: booking.guest_email || '',
    guest_phone: booking.guest_phone || '',
    num_guests: booking.num_guests?.toString() || '1',
    status: booking.status,
    special_requests: booking.special_requests || '',
    notes: booking.notes || '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: formData.guest_name || null,
          guest_email: formData.guest_email || null,
          guest_phone: formData.guest_phone || null,
          num_guests: formData.num_guests ? parseInt(formData.num_guests) : null,
          status: formData.status,
          special_requests: formData.special_requests || null,
          notes: formData.notes || null,
        }),
      })

      if (response.ok) {
        setEditing(false)
        router.refresh()
      } else {
        const data = await response.json()
        console.error('Failed to update booking:', data.error)
      }
    } catch (error) {
      console.error('Failed to update booking:', error)
    } finally {
      setSaving(false)
    }
  }

  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Booking Details</DialogTitle>
            <Badge className={statusColors[booking.status] || statusColors.pending}>
              {booking.status}
            </Badge>
          </div>
          {booking.confirmation_code && (
            <DialogDescription>
              Confirmation: {booking.confirmation_code}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Property */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{booking.property?.name || 'Unknown Property'}</p>
              {booking.source_url && (
                <a
                  href={booking.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View on source <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Check-in</p>
                <p className="font-medium">{booking.check_in}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Check-out</p>
                <p className="font-medium">{booking.check_out}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </p>

          <Separator />

          {/* Guest Info */}
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="guest_name">Guest Name</Label>
                <Input
                  id="guest_name"
                  value={formData.guest_name}
                  onChange={(e) => handleChange('guest_name', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="guest_email">Email</Label>
                  <Input
                    id="guest_email"
                    type="email"
                    value={formData.guest_email}
                    onChange={(e) => handleChange('guest_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest_phone">Phone</Label>
                  <Input
                    id="guest_phone"
                    value={formData.guest_phone}
                    onChange={(e) => handleChange('guest_phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="num_guests">Guests</Label>
                  <Input
                    id="num_guests"
                    type="number"
                    min="1"
                    value={formData.num_guests}
                    onChange={(e) => handleChange('num_guests', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="special_requests">Special Requests</Label>
                <Textarea
                  id="special_requests"
                  rows={2}
                  value={formData.special_requests}
                  onChange={(e) => handleChange('special_requests', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Notes only visible to your team..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{booking.guest_name || 'Unknown Guest'}</p>
                  {booking.num_guests && (
                    <p className="text-xs text-muted-foreground">{booking.num_guests} guests</p>
                  )}
                </div>
              </div>

              {booking.guest_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${booking.guest_email}`} className="text-sm hover:underline">
                    {booking.guest_email}
                  </a>
                </div>
              )}

              {booking.guest_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${booking.guest_phone}`} className="text-sm hover:underline">
                    {booking.guest_phone}
                  </a>
                </div>
              )}

              {booking.special_requests && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Special Requests</p>
                    <p className="text-sm">{booking.special_requests}</p>
                  </div>
                </div>
              )}

              {booking.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Internal Notes</p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}

              {/* Guest Profile */}
              {booking.guest_profile && (
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-2">Guest Profile</p>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">{booking.guest_profile.name}</p>
                    {booking.guest_profile.total_bookings > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {booking.guest_profile.total_bookings} previous bookings
                        {booking.guest_profile.average_rating && (
                          <> &middot; {Number(booking.guest_profile.average_rating).toFixed(1)} avg rating</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Payments */}
          {booking.payments && booking.payments.length > 0 && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Payment History</p>
                <div className="space-y-2">
                  {booking.payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between text-sm p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {payment.currency} {payment.amount.toLocaleString()}
                        </span>
                        {payment.payment_method && (
                          <span className="text-xs text-muted-foreground">
                            via {payment.payment_method}
                          </span>
                        )}
                      </div>
                      <Badge variant={
                        payment.status === 'paid' ? 'default' :
                        payment.status === 'refunded' ? 'destructive' : 'secondary'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold">
              {booking.total_price
                ? `${booking.currency} ${booking.total_price.toLocaleString()}`
                : '-'}
            </p>
          </div>
        </div>

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              {canEdit && (
                <Button onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
