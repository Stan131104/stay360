import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started with 1-2 properties.',
    features: [
      'Up to 2 properties',
      'Basic calendar sync',
      'Email support',
      'Mobile app access',
    ],
    cta: 'Start free',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing hosts managing multiple properties.',
    features: [
      'Up to 10 properties',
      'Advanced calendar sync',
      'Automated messaging',
      'Analytics dashboard',
      'Priority support',
      'Team members (up to 3)',
    ],
    cta: 'Start free trial',
    href: '/signup',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For professional property management companies.',
    features: [
      'Unlimited properties',
      'All Pro features',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'Unlimited team members',
      'API access',
    ],
    cta: 'Contact sales',
    href: '#',
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="container mx-auto px-4 py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your needs. All plans include a 14-day free trial.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={cn(
              'flex flex-col',
              tier.highlighted && 'border-primary shadow-lg scale-105'
            )}
          >
            <CardHeader>
              {tier.highlighted && (
                <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                  Most Popular
                </div>
              )}
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && (
                  <span className="text-muted-foreground">{tier.period}</span>
                )}
              </div>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href={tier.href} className="w-full">
                <Button
                  className="w-full"
                  variant={tier.highlighted ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
