import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SignInButton } from '@clerk/clerk-react'
import { useApi } from '../lib/useApi'

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function Stars({ rating, size = 'sm' }) {
  if (rating == null) return null
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  const cls = size === 'lg' ? 'text-xl' : 'text-base'
  return (
    <span className={`inline-flex items-center gap-0.5 ${cls}`}>
      {[...Array(full)].map((_, i) => (
        <span key={i} className="text-accent">★</span>
      ))}
      {half && <span className="text-accent">½</span>}
      {[...Array(empty)].map((_, i) => (
        <span key={i} className="text-stone-600">★</span>
      ))}
    </span>
  )
}

export default function RangeReviews({ range }) {
  const queryClient = useQueryClient()
  const { api, isSignedIn } = useApi()
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', range.id],
    queryFn: () => api.get('/reviews', { rangeId: range.id }),
  })
  const reviews = reviewsData?.data ?? []

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/reviews', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', range.id] })
      queryClient.invalidateQueries({ queryKey: ['range', range.slug] })
      setShowForm(false)
      setBody('')
      setVisitDate('')
    },
  })

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      rangeId: range.id,
      rating,
      body: body.trim(),
    }
    if (visitDate) payload.visitDate = new Date(visitDate).toISOString()
    mutation.mutate(payload)
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-stone-100 mb-2">Reviews</h2>
      {avgRating != null && (
        <div className="flex items-center gap-3 mb-4">
          <Stars rating={avgRating} size="lg" />
          <span className="text-stone-400">
            {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
          </span>
        </div>
      )}
      {!isSignedIn && (
        <p className="text-stone-500 mb-4">
          Sign in to write a review.
          {hasClerk && (
            <SignInButton mode="modal">
              <button type="button" className="ml-2 text-accent hover:underline">
                Sign in
              </button>
            </SignInButton>
          )}
        </p>
      )}
      {isSignedIn && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 rounded bg-accent text-white font-medium text-sm hover:bg-accent-light"
        >
          Write a Review
        </button>
      )}
      {isSignedIn && showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg border border-stone-700 bg-surface-elevated space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-1">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`p-1 text-2xl transition-colors ${
                    n <= rating ? 'text-accent' : 'text-stone-600 hover:text-stone-500'
                  }`}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-1">Your review (min 10 characters)</label>
            <textarea
              required
              minLength={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Share your experience at this range..."
              className="w-full px-4 py-2 rounded border border-stone-700 bg-surface text-stone-100 placeholder-stone-500 outline-none focus:border-stone-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-1">Visit date (optional)</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full max-w-xs px-4 py-2 rounded border border-stone-700 bg-surface text-stone-100 outline-none focus:border-stone-600"
            />
          </div>
          {mutation.isError && <p className="text-red-400 text-sm">{mutation.error.message}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={mutation.isPending || body.trim().length < 10}
              className="px-4 py-2 rounded bg-accent text-white font-medium text-sm hover:bg-accent-light disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded border border-stone-600 text-stone-400 text-sm hover:bg-surface-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <div className="space-y-4">
        {reviews.length === 0 && !showForm && (
          <p className="text-stone-500">No reviews yet. Be the first to review this range.</p>
        )}
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded-lg border border-stone-700 bg-surface-elevated"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <Stars rating={review.rating} />
              <span className="text-sm text-stone-500">
                {review.user?.name ?? 'Anonymous'} · {new Date(review.createdAt).toLocaleDateString()}
                {review.visitDate && ` · Visited ${new Date(review.visitDate).toLocaleDateString()}`}
              </span>
            </div>
            <p className="text-stone-300 whitespace-pre-wrap">{review.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
