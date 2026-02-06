import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireActiveTenant } from '@/lib/tenancy'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Users,
  MapPin,
  Calendar,
  Clock,
  Star,
  ExternalLink,
  Building2,
  DollarSign,
  CalendarCheck,
} from 'lucide-react'
import { PropertyPhotos } from '@/components/properties/property-photos'
import { PropertyAmenities } from '@/components/properties/property-amenities'
import { PropertyEditDialog } from '@/components/properties/property-edit-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params
  const { tenant } = await requireActiveTenant()
  const supabase = await createClient()

  // Fetch property with all related data
  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      integration:integrations(name, provider),
      details:property_details(*),
      photos:property_photos(*),
      amenities:property_amenities(*),
      fees:property_fees(*),
      reviews:guest_reviews(*)
    `)
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single()

  if (error || !property) {
    notFound()
  }

  // Fetch booking stats
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [bookingsCountResult, upcomingBookingsResult, revenueResult] = await Promise.all([
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', id)
      .eq('tenant_id', tenant.id),
    supabase
      .from('bookings')
      .select('id, check_in, check_out, guest_name, status, total_price')
      .eq('property_id', id)
      .eq('tenant_id', tenant.id)
      .gte('check_in', now.toISOString().split('T')[0])
      .lte('check_in', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('check_in', { ascending: true })
      .limit(5),
    supabase
      .from('bookings')
      .select('total_price')
      .eq('property_id', id)
      .eq('tenant_id', tenant.id)
      .eq('status', 'confirmed')
      .gte('check_in', thirtyDaysAgo.toISOString().split('T')[0]),
  ])

  const totalBookings = bookingsCountResult.count || 0
  const upcomingBookings = upcomingBookingsResult.data || []
  const totalRevenue = revenueResult.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0

  // Calculate average rating
  const reviews = property.reviews || []
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
    : null

  const canEdit = ['OWNER', 'MANAGER'].includes(tenant.role)
  const details = Array.isArray(property.details) ? property.details[0] : property.details
  const photos = property.photos || []
  const amenities = property.amenities || []
  const fees = property.fees || []
  const integration = Array.isArray(property.integration) ? property.integration[0] : property.integration

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to properties
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
              <Badge variant={property.is_active ? 'default' : 'secondary'}>
                {property.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {(property.city || property.country) && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {[property.address, property.city, property.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {property.listing_url && (
              <Button variant="outline" asChild>
                <a href={property.listing_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Listing
                </a>
              </Button>
            )}
            {canEdit && (
              <PropertyEditDialog
                property={{
                  ...property,
                  details: details || null,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBookings}</p>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-full">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Revenue (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-500/10 rounded-full">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {avgRating ? avgRating.toFixed(1) : '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Photos & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyPhotos photos={photos} propertyName={property.name} />
            </CardContent>
          </Card>

          {/* Description */}
          {details?.description && (
            <Card>
              <CardHeader>
                <CardTitle>About this property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {details.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                {amenities.length} amenities available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyAmenities amenities={amenities} showAll />
            </CardContent>
          </Card>

          {/* Reviews */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Guest Reviews</CardTitle>
                <CardDescription>
                  {avgRating && `${avgRating.toFixed(1)} average from ${reviews.length} reviews`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review: {
                    id: string
                    reviewer_name: string
                    rating: number
                    review_text: string | null
                    created_at: string
                    host_response: string | null
                  }) => (
                    <div key={review.id} className="pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.reviewer_name}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground">{review.review_text}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                      {review.host_response && (
                        <div className="mt-2 pl-4 border-l-2">
                          <p className="text-sm font-medium">Host response:</p>
                          <p className="text-sm text-muted-foreground">{review.host_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Property Info */}
        <div className="space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <BedDouble className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="text-lg font-medium mt-1">{property.bedrooms || '-'}</p>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                </div>
                <div className="text-center">
                  <Bath className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="text-lg font-medium mt-1">{property.bathrooms || '-'}</p>
                  <p className="text-xs text-muted-foreground">Bathrooms</p>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="text-lg font-medium mt-1">{property.max_guests || '-'}</p>
                  <p className="text-xs text-muted-foreground">Guests</p>
                </div>
              </div>

              <Separator />

              {details?.property_type && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Property Type</span>
                  <span className="font-medium capitalize">
                    {details.property_type.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {details?.check_in_time && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium">{details.check_in_time}</span>
                </div>
              )}

              {details?.check_out_time && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">{details.check_out_time}</span>
                </div>
              )}

              {details?.min_nights && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Stay</span>
                  <span className="font-medium">{details.min_nights} nights</span>
                </div>
              )}

              {details?.max_nights && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Stay</span>
                  <span className="font-medium">{details.max_nights} nights</span>
                </div>
              )}

              {details?.instant_book_enabled !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Instant Book</span>
                  <Badge variant={details.instant_book_enabled ? 'default' : 'secondary'}>
                    {details.instant_book_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fees */}
          {fees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fees.map((fee: {
                    id: string
                    name: string
                    fee_type: string
                    amount: number
                    is_percentage: boolean
                    is_mandatory: boolean
                  }) => (
                    <div key={fee.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {fee.name}
                        {fee.is_mandatory && <span className="text-red-500">*</span>}
                      </span>
                      <span className="font-medium">
                        {fee.is_percentage ? `${fee.amount}%` : `$${fee.amount}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Policies */}
          {(details?.house_rules || details?.cancellation_policy) && (
            <Card>
              <CardHeader>
                <CardTitle>Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {details?.house_rules && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">House Rules</h4>
                    <p className="text-sm text-muted-foreground">{details.house_rules}</p>
                  </div>
                )}
                {details?.cancellation_policy && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Cancellation Policy</h4>
                    <p className="text-sm text-muted-foreground">{details.cancellation_policy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Source Integration */}
          {integration && (
            <Card>
              <CardHeader>
                <CardTitle>Data Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {integration.provider.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                {property.provider_property_id && (
                  <p className="text-xs text-muted-foreground mt-3">
                    External ID: {property.provider_property_id}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bookings */}
          {upcomingBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{booking.guest_name || 'Guest'}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.check_in} - {booking.check_out}
                        </p>
                      </div>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/dashboard/bookings?property=${id}`}
                  className="block text-center text-sm text-primary hover:underline mt-4"
                >
                  View all bookings
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
