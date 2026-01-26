'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface Booking {
  id: string
  check_in: string
  check_out: string
  guest_name: string | null
  status: string
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

export function CalendarView({ initialBookings, properties, initialYear, initialMonth }: CalendarViewProps) {
  const [currentYear, setCurrentYear] = useState(initialYear)
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [loading, setLoading] = useState(false)

  const today = new Date()

  // Calculate calendar data
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = endOfMonth.getDate()
  const firstDayOfWeek = startOfMonth.getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Map bookings to dates
  const bookingsByDate = new Map<string, Booking[]>()
  bookings?.forEach(booking => {
    const checkIn = new Date(booking.check_in)
    const checkOut = new Date(booking.check_out)

    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!bookingsByDate.has(dateStr)) {
        bookingsByDate.set(dateStr, [])
      }
      bookingsByDate.get(dateStr)!.push(booking)
    }
  })

  const fetchBookings = async (year: number, month: number) => {
    setLoading(true)
    try {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0)

      const response = await fetch(
        `/api/bookings?start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`
      )

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

  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1
    let newYear = currentYear

    if (newMonth < 0) {
      newMonth = 11
      newYear--
    }

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    fetchBookings(newYear, newMonth)
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
    fetchBookings(newYear, newMonth)
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    fetchBookings(now.getFullYear(), now.getMonth())
  }

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year)
    setCurrentYear(newYear)
    fetchBookings(newYear, currentMonth)
  }

  const handleMonthChange = (month: string) => {
    const newMonth = parseInt(month)
    setCurrentMonth(newMonth)
    fetchBookings(currentYear, newMonth)
  }

  // Generate year options (5 years back, 2 years forward)
  const currentRealYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentRealYear - 5 + i)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{monthNames[currentMonth]} {currentYear}</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${bookings?.length || 0} bookings this month`}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
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
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
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
                <div key={`empty-${i}`} className="min-h-24 bg-background" />
              ))}

              {/* Days of the month */}
              {days.map(day => {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayBookings = bookingsByDate.get(dateStr) || []
                const isToday = day === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear()

                return (
                  <div
                    key={day}
                    className={`min-h-24 p-1 bg-background ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <div
                          key={booking.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : booking.status === 'blocked'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                          title={`${booking.property?.name || 'Unknown'}: ${booking.guest_name || 'Blocked'}`}
                        >
                          {(booking.property?.name || 'Unknown').slice(0, 10)}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayBookings.length - 2} more
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
  )
}
