import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { usePublicEvents } from '@/hooks'
import { fadeInUp, staggerContainer } from '@/config/animations'

export default function PublicEventsPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc'>('date_asc')
  const [page, setPage] = useState(1)

  // Fetch events using hook
  const { data, isLoading } = usePublicEvents({
    page,
    limit: 9,
    search: search || undefined, // use search directly if we want immediate or debounced
    sortBy,
  })

  const events = data?.events || []
  const pagination = data?.pagination

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
          College Events & <span className="text-primary">Virtual Kits</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Find your college event, verify your Team ID, and unlock customized project hardware kits tailored directly to your curriculum guidelines.
        </p>
      </div>

      {/* Filter & Sort controls bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by event name, organization, or college..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <span className="text-xs font-semibold text-muted-foreground">Sort by Date:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any)
              setPage(1)
            }}
            className="text-sm border border-border rounded-lg bg-card text-foreground px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="date_asc">Earliest First</option>
            <option value="date_desc">Latest First</option>
          </select>
        </div>
      </div>

      {/* Grid of Events */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 border border-dashed border-border rounded-2xl max-w-xl mx-auto">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-bold text-foreground">No events active</h3>
          <p className="text-xs text-muted-foreground mt-1">
            We couldn't find any approved events matching your parameters. Please check back later!
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {events.map((event) => {
            const startDate = new Date(event.startDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })
            const endDate = new Date(event.endDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            const originalVal = event.totalKitValue || 0
            const sellPrice = event.eventKitPrice || 0
            const disc = Math.max(0, originalVal - sellPrice)

            return (
              <motion.div key={event._id} variants={fadeInUp}>
                <Card className="h-full flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow bg-card border-border">
                  <div>
                    {/* Event Banner */}
                    <div className="relative h-48 bg-muted overflow-hidden border-b border-border">
                      {event.banner?.url ? (
                        <img
                          src={event.banner.url}
                          alt={event.eventName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground/30 font-mono text-xs">
                          SHORT CIRCUIT EVENT
                        </div>
                      )}
                      {disc > 0 && (
                        <div className="absolute top-3 right-3 bg-success text-white text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          Bundle Deal
                        </div>
                      )}
                    </div>

                    <CardHeader className="p-5 pb-2">
                      <CardTitle className="text-lg font-bold line-clamp-1">{event.eventName}</CardTitle>
                      <div className="space-y-1 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{event.organizationName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
                          <span className="truncate">{event.collegeName}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-1 pb-2 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>
                          {startDate} - {endDate}
                        </span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex items-end justify-between py-1.5">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground font-semibold">Special Bundle Price</p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-extrabold text-foreground">₹{sellPrice}</span>
                            {disc > 0 && (
                              <span className="text-xs text-muted-foreground line-through">₹{originalVal}</span>
                            )}
                          </div>
                        </div>
                        {disc > 0 && (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-success bg-success/10 rounded-full px-2 py-0.5">
                              Save ₹{disc}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-5 pt-0">
                    <Button asChild className="w-full text-xs font-semibold h-10">
                      <Link to={`/events/${event.slug}`}>
                        View Event Details
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-semibold text-muted-foreground px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
