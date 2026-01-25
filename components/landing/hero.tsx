import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle } from 'lucide-react'

export function Hero() {
  return (
    <section className="container mx-auto px-4 py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
        <div className="flex flex-col space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Manage your stays with{' '}
              <span className="text-primary">complete control</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg">
              The all-in-one platform for property managers and hosts. Streamline bookings, automate tasks, and grow your rental business.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn more
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl font-bold text-primary mb-4">360</div>
              <div className="text-xl font-medium text-muted-foreground">
                Complete Property Management
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-xl bg-primary/10 -z-10" />
          <div className="absolute -top-4 -left-4 h-16 w-16 rounded-xl bg-primary/5 -z-10" />
        </div>
      </div>
    </section>
  )
}
