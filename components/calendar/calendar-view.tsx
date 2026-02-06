'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarFilters } from './calendar-filters'
import { BookingPopover } from './booking-popover'
import { cn } from '@/lib/utils'

interface Booking {
  id: string
  check_in: string
  check_out: string
  guest_name: string | null
  status: string
  total_price?: number | null
  currency?: string
  property: { id: string; name: string } | null
}

interface Property {
  id: string
  name: string
}

interface CalendarViewProps {
  initialBookings: Booking[]
  properties: Property[]
  initialYear: number
  initialMonth: number
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  blocked: 'bg-gray-400',
}

const statusBgColors: Record<string, string> = {
  confirmed: 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900',
  pending: 'bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-900',
  cancelled: 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900',
  blocked: 'bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800',
}

const statusTextColors: Record<string, string> = {
  confirmed: 'text-green-800 dark:text-green-200',
  pending: 'text-yellow-800 dark:text-yellow-200',
  cancelled: 'text-red-800 dark:text-red-200',
  blocked: 'text-gray-800 dark:text-gray-200',
}

export function CalendarView({ initialBookings, properties, initialYear, initialMonth }: CalendarViewProps) {
  const [currentYear, setCurrentYear] = useState(initialYear)
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [loading, setLoading] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const today = new Date()

  // Filter bookings by selected property
  const filteredBookings = useMemo(() => {
    if (!selectedPropertyId) return bookings
    return bookings.filter(b => b.property?.id === selectedPropertyId)
  }, [bookings, selectedPropertyId])

  // Calculate calendar data
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = endOfMonth.getDate()
  const firstDayOfWeek = startOfMonth.getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Map bookings to dates
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    filteredBookings?.forEach(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)

      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        if (!map.has(dateStr)) {
          map.set(dateStr, [])
        }
        map.get(dateStr)!.push(booking)
      }
    })
    return map
  }, [filteredBookings])

  // Count bookings by status for the month
  const bookingStats = useMemo(() => {
    const stats = { confirmed: 0, pending: 0, blocked: 0, cancelled: 0 }
    filteredBookings.forEach(b => {
      if (stats.hasOwnProperty(b.status)) {
        stats[b.status as keyof typeof stats]++
      }
    })
    return stats
  }, [filteredBookings])

  const fetchBookings = async (year: number, month: number, propertyId: string | null) => {
    setLoading(true)
    try {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)

      let url = `/api/bookings?start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`
      if (propertyId) {
        url += `&property=${propertyId}`
      }

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePropertyChange = (propertyId: string | null) => {
    setSelectedPropertyId(propertyId)
    fetchBookings(currentYear, currentMonth, propertyId)
  }

  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1
    let newYear = currentYear

    if (newMonth < 0) {
      newMonth = 11
      newYear--
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    fetchBookings(newYear, newMonth, selectedPropertyId)
  }

  const goToNextMonth = () => {
    let newMonth = currentMonth + 1
    let newYear = currentYear

    if (newMonth > 11) {
      newMonth = 0
      newYear++
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    fetchBookings(newYear, newMonth, selectedPropertyId)
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    fetchBookings(now.getFullYear(), now.getMonth(), selectedPropertyId)
  }

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year)
    setCurrentYear(newYear)
    fetchBookings(newYear, currentMonth, selectedPropertyId)
  }

  const handleMonthChange = (month: string) => {
    const newMonth = parseInt(month)
    setCurrentMonth(newMonth)
    fetchBookings(currentYear, newMonth, selectedPropertyId)
  }

  // Generate year options (5 years back, 2 years forward)
  const currentRealYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentRealYear - 5 + i)

  return (
    <div className="space-y-4">
      <CalendarFilters
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={handlePropertyChange}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{monthNames[currentMonth]} {currentYear}</CardTitle>
              <CardDescription className="flex flex-wrap gap-2 mt-1">
                {loading ? (
                  'Loading...'
                ) : (
                  <>
                    <span>{filteredBookings?.length || 0} bookings</span>
                    {bookingStats.confirmed > 0 && (
                      <Badge variant="outline" className="text-green-600">
                        {bookingStats.confirmed} confirmed
                      </Badge>
                    )}
                    {bookingStats.pending > 0 && (
                      <Badge variant="outline" className="text-yellow-600">
                        {bookingStats.pending} pending
                      </Badge>
                    )}
                  </>
                )}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!properties || properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No properties to display. Connect an integration to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Calendar header */}
              <div className="grid grid-cols-7 gap-px bg-muted text-center text-xs font-medium mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2 bg-background">{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-muted">
                {/* Empty cells for days before the 1st */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-28 bg-muted/30" />
                ))}

                {/* Days of the month */}
                {days.map(day => {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayBookings = bookingsByDate.get(dateStr) || []
                  const isToday = day === today.getDate() &&
                    currentMonth === today.getMonth() &&
                    currentYear === today.getFullYear()
                  const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0])

                  return (
                    <div
                      key={day}
                      className={cn(
                        'min-h-28 p-1 bg-background transition-colors',
                        isToday && 'ring-2 ring-primary ring-inset',
                        isPast && 'bg-muted/20'
                      )}
                    >
                      <div className={cn(
                        'text-xs font-medium mb-1 flex items-center justify-between',
                        isToday ? 'text-primary' : isPast ? 'text-muted-foreground' : 'text-foreground'
                      )}>
                        <span>{day}</span>
                        {dayBookings.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {dayBookings.length} {dayBookings.length === 1 ? 'booking' : 'bookings'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayBookings.slice(0, 3).map((booking) => (
                          <BookingPopover key={booking.id} booking={booking}>
                            <button
                              className={cn(
                                'w-full text-left text-xs px-1.5 py-1 rounded truncate cursor-pointer transition-colors',
                                statusBgColors[booking.status] || statusBgColors.pending,
                                statusTextColors[booking.status] || statusTextColors.pending
                              )}
                            >
                              <div className="flex items-center gap-1">
                                <div className={cn(
                                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                  statusColors[booking.status] || statusColors.pending
                                )} />
                                <span className="truncate">
                                  {booking.guest_name || booking.property?.name || 'Blocked'}
                                </span>
                              </div>
                            </button>
                          </BookingPopover>
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="text-[10px] text-muted-foreground px-1">
                            +{dayBookings.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
