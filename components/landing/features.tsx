import { Calendar, BarChart3, MessageSquare, Shield, Zap, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Calendar,
    title: 'Smart Booking Calendar',
    description: 'Unified calendar syncing with Airbnb, VRBO, and Booking.com. Never double-book again.',
  },
  {
    icon: MessageSquare,
    title: 'Automated Messaging',
    description: 'Set up automated guest communications for check-in instructions, reminders, and reviews.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track occupancy rates, revenue, and performance metrics across all your properties.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'PCI-compliant payment processing with automatic payouts and financial reporting.',
  },
  {
    icon: Zap,
    title: 'Task Automation',
    description: 'Automate cleaning schedules, maintenance requests, and team coordination.',
  },
  {
    icon: Globe,
    title: 'Multi-Property Support',
    description: 'Manage unlimited properties from a single dashboard with role-based access control.',
  },
]

export function Features() {
  return (
    <section id="features" className="container mx-auto px-4 py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to succeed
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Powerful features designed for professional property managers and ambitious hosts.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
