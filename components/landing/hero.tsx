import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, Building2, CalendarDays, TrendingUp } from 'lucide-react'

export function Hero() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Manage your rentals with{' '}
                <span className="text-[#669bbc]">complete control</span>
              </h1>
              <p className="text-xl text-primary-foreground/80 max-w-lg">
                The all-in-one platform for property managers and hosts. Streamline bookings, automate tasks, and grow your rental business.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-[#c1121f] text-white hover:bg-[#a10f1a] font-semibold">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Learn more
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc]" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#669bbc]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-[#0a4060] backdrop-blur rounded-xl p-6 border border-[#669bbc]/30">
                  <Building2 className="h-8 w-8 text-[#669bbc] mb-3" />
                  <div className="text-3xl font-bold">150+</div>
                  <div className="text-sm text-primary-foreground/70">Properties managed</div>
                </div>
                <div className="bg-[#0a4060] backdrop-blur rounded-xl p-6 border border-[#669bbc]/30">
                  <TrendingUp className="h-8 w-8 text-[#669bbc] mb-3" />
                  <div className="text-3xl font-bold">32%</div>
                  <div className="text-sm text-primary-foreground/70">Revenue increase</div>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="bg-[#0a4060] backdrop-blur rounded-xl p-6 border border-[#669bbc]/30">
                  <CalendarDays className="h-8 w-8 text-[#669bbc] mb-3" />
                  <div className="text-3xl font-bold">2.5K</div>
                  <div className="text-sm text-primary-foreground/70">Bookings synced</div>
                </div>
                <div className="bg-[#c1121f]/20 backdrop-blur rounded-xl p-6 border border-[#c1121f]/30">
                  <div className="text-5xl font-bold text-[#c1121f]">360</div>
                  <div className="text-sm text-primary-foreground/80 mt-2">Complete visibility</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave separator */}
      <div className="h-16 bg-background" style={{
        clipPath: 'ellipse(75% 100% at 50% 100%)',
        marginTop: '-4rem'
      }} />
    </section>
  )
}
