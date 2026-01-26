'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '\u20ac' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00a3' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00a5' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '\u00a5' },
  { code: 'INR', name: 'Indian Rupee', symbol: '\u20b9' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'THB', name: 'Thai Baht', symbol: '\u0e3f' },
  { code: 'AED', name: 'UAE Dirham', symbol: '\u062f.\u0625' },
]

interface WorkspaceSettingsFormProps {
  tenant: {
    name: string
    default_currency?: string
  }
  isOwner: boolean
}

export function WorkspaceSettingsForm({ tenant, isOwner }: WorkspaceSettingsFormProps) {
  const [name, setName] = useState(tenant.name)
  const [currency, setCurrency] = useState(tenant.default_currency || 'USD')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)
    setError(null)

    try {
      const response = await fetch('/api/tenant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          default_currency: currency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setSuccess(true)
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = name !== tenant.name || currency !== (tenant.default_currency || 'USD')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isOwner}
          placeholder="My Workspace"
        />
        {!isOwner && (
          <p className="text-xs text-muted-foreground">
            Only the workspace owner can change the name
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Default currency</Label>
        <Select value={currency} onValueChange={setCurrency} disabled={!isOwner}>
          <SelectTrigger id="currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isOwner && (
          <p className="text-xs text-muted-foreground">
            Only the workspace owner can change the currency
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-100 dark:bg-green-900 p-3 text-sm text-green-800 dark:text-green-200">
          Settings saved successfully
        </div>
      )}

      {isOwner && (
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
          {loading ? 'Saving...' : 'Save changes'}
        </Button>
      )}
    </div>
  )
}
