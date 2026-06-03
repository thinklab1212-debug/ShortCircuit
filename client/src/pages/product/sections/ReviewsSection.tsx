import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, ThumbsUp, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { useProductReviews, useCreateReview } from '@/hooks/useProductDetail'
import { useAuthStore } from '@/store'
import { fadeInUp, staggerContainer } from '@/config/animations'
import type { Review } from '@/types'

// ─── Rating Summary ─────────────────────────────────────────────────────────────

function RatingSummary({ average, count }: { average: number; count: number }) {
  const bars = [5, 4, 3, 2, 1]

  return (
    <div className="flex flex-col sm:flex-row gap-8 items-start">
      {/* Big Score */}
      <div className="text-center space-y-1">
        <div className="text-5xl font-bold font-heading text-foreground">{average.toFixed(1)}</div>
        <div className="flex items-center justify-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < Math.round(average)
                  ? 'fill-warning-400 text-warning-400'
                  : 'fill-none text-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{count} reviews</p>
      </div>

      {/* Distribution Bars (placeholder — backend doesn't provide this) */}
      <div className="flex-1 space-y-2 w-full sm:max-w-xs">
        {bars.map((star) => (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-muted-foreground">{star}</span>
            <Star className="h-3 w-3 fill-warning-400 text-warning-400 shrink-0" />
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-warning-400 transition-all"
                style={{ width: `${star === Math.round(average) ? 60 : star > average ? 10 : 20}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Review Card ────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const user = typeof review.user === 'object' ? review.user : null
  const date = new Date(review.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-xl border border-border bg-card p-5 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user ? `${user.firstName} ${user.lastName}` : 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-success-50 dark:bg-success-950/50 px-2 py-0.5">
          <span className="text-xs font-bold text-success-700 dark:text-success-400">{review.rating}</span>
          <Star className="h-3 w-3 fill-success-600 text-success-600 dark:fill-success-400 dark:text-success-400" />
        </div>
      </div>

      {review.title && (
        <h4 className="text-sm font-semibold text-foreground">{review.title}</h4>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>

      {review.isVerifiedPurchase && (
        <div className="flex items-center gap-1.5 text-xs text-success-600 dark:text-success-400">
          <ThumbsUp className="h-3 w-3" />
          Verified Purchase
        </div>
      )}
    </motion.div>
  )
}

// ─── Write Review Form ──────────────────────────────────────────────────────────

function WriteReviewForm({ productId }: { productId: string }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const createReview = useCreateReview(productId)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Please <a href="/login" className="text-primary font-medium hover:underline">sign in</a> to write a review.
        </p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    createReview.mutate(
      { rating, title, comment },
      {
        onSuccess: () => {
          setRating(0)
          setTitle('')
          setComment('')
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
      <h3 className="text-base font-semibold text-foreground">Write a Review</h3>

      {/* Star Rating */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Your Rating *</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={cn(
                  'h-6 w-6 transition-colors',
                  star <= (hoveredRating || rating)
                    ? 'fill-warning-400 text-warning-400'
                    : 'fill-none text-muted-foreground/30'
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      <FormField label="Review Title" htmlFor="review-title">
        <Input
          id="review-title"
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormField>

      <FormField label="Your Review" htmlFor="review-comment" required>
        <Textarea
          id="review-comment"
          placeholder="What did you like or dislike about this product?"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </FormField>

      <Button
        type="submit"
        loading={createReview.isPending}
        loadingText="Submitting..."
        disabled={rating === 0 || !comment.trim()}
      >
        Submit Review
      </Button>
    </form>
  )
}

// ─── Reviews Section ────────────────────────────────────────────────────────────

interface ReviewsSectionProps {
  productId: string
  ratingsAverage: number
  ratingsQuantity: number
}

export default function ReviewsSection({ productId, ratingsAverage, ratingsQuantity }: ReviewsSectionProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProductReviews(productId, page)

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold font-heading text-foreground">
        Customer Reviews
      </h2>

      {/* Rating Summary */}
      {ratingsQuantity > 0 && (
        <RatingSummary average={ratingsAverage} count={ratingsQuantity} />
      )}

      {/* Reviews List */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 skeleton rounded-full" />
                <div className="space-y-1">
                  <div className="h-3 w-24 skeleton rounded" />
                  <div className="h-2 w-16 skeleton rounded" />
                </div>
              </div>
              <div className="h-4 w-3/4 skeleton rounded" />
              <div className="h-3 w-full skeleton rounded" />
            </div>
          ))}
        </div>
      )}

      {data && data.data.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {data.data.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </motion.div>
      )}

      {data && data.data.length === 0 && ratingsQuantity === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          No reviews yet. Be the first to review this product!
        </p>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= data.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Write Review */}
      <WriteReviewForm productId={productId} />
    </div>
  )
}
