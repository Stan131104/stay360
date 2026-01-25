'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTenant } from '@/lib/tenancy/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function WorkspacePage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createTenant({ name })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Redirect to connect integration
    router.push('/onboarding/connect')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create your workspace</CardTitle>
          <CardDescription>
            A workspace is where you&apos;ll manage your properties and bookings
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                placeholder="My Vacation Rentals"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This can be your company name or property portfolio name
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create workspace'}
            </Button>
            <Link
              href="/dashboard"
              className="text-center text-sm text-muted-foreground hover:text-primary"
            >
              I already have a workspace
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
