'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink } from 'lucide-react'

interface OAuthConnectButtonProps {
  provider: string
  onConnect: () => Promise<{ redirectUrl: string } | void>
  onSuccess?: () => void
  disabled?: boolean
  children?: React.ReactNode
}

export function OAuthConnectButton({
  provider,
  onConnect,
  onSuccess,
  disabled,
  children,
}: OAuthConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await onConnect()
      if (result?.redirectUrl) {
        // Open OAuth popup or redirect
        window.location.href = result.redirectUrl
      } else {
        onSuccess?.()
      }
    } catch (error) {
      console.error('OAuth connect failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          {children || `Connect ${provider}`}
          <ExternalLink className="h-4 w-4 ml-2" />
        </>
      )}
    </Button>
  )
}
