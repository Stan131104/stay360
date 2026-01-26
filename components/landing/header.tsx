import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full bg-[#003049] text-[#fdf0d5]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">Stay<span className="text-[#c1121f]">360</span></span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="#features" className="text-sm font-medium text-[#fdf0d5]/80 hover:text-[#fdf0d5]">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-[#fdf0d5]/80 hover:text-[#fdf0d5]">
            Pricing
          </Link>
          <Link href="/docs" className="text-sm font-medium text-[#fdf0d5]/80 hover:text-[#fdf0d5]">
            Docs
          </Link>
          <Link href="/changelog" className="text-sm font-medium text-[#fdf0d5]/80 hover:text-[#fdf0d5]">
            Changelog
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-[#669bbc] text-[#fdf0d5] hover:bg-[#669bbc]/20">
                  Dashboard
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-[#fdf0d5]/10">
                    <Avatar className="h-9 w-9 border border-[#669bbc]">
                      <AvatarFallback className="bg-[#c1121f] text-white">
                        {user.email?.charAt(0).toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-sm text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/logout">Logout</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[#fdf0d5] hover:bg-[#fdf0d5]/10">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-[#c1121f] text-white hover:bg-[#a10f1a] font-semibold">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
