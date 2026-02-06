'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Check, X, Loader2 } from 'lucide-react'

interface RateEditorProps {
  rateId: string
  propertyId: string
  date: string
  initialPrice: number
  currency: string
  minNights?: number
  onSave: (rateId: string, newPrice: number) => Promise<void>
}

export function RateEditor({
  rateId,
  propertyId,
  date,
  initialPrice,
  currency,
  minNights,
  onSave,
}: RateEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [price, setPrice] = useState(initialPrice.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    const newPrice = parseFloat(price)
    if (isNaN(newPrice) || newPrice < 0) {
      setError('Invalid price')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave(rateId, newPrice)
      setIsEditing(false)
    } catch (err) {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setPrice(initialPrice.toString())
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-xs">{currency}</span>
        <Input
          ref={inputRef}
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'h-7 w-20 text-right text-sm',
            error && 'border-red-500'
          )}
          disabled={saving}
          min={0}
          step={0.01}
        />
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            <button
              onClick={handleSave}
              className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
            >
              <Check className="h-3 w-3 text-green-600" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
            >
              <X className="h-3 w-3 text-red-600" />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'px-2 py-1 rounded text-right hover:bg-muted transition-colors cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      {currency} {initialPrice.toFixed(2)}
    </button>
  )
}
