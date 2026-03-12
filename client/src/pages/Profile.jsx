import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useApi } from '../lib/useApi'
import { FOCUS_LABELS } from '../lib/gunsmithTaxonomy'

function Stars({ rating }) {
  if (rating == null) return null
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span className="inline-flex items-center gap-0.5">
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

export default function Profile() {
  const { api, isSignedIn } = useApi()

  const { data: savedRangesData } = useQuery({
    queryKey: ['ranges', 'saved'],
    queryFn: () => api.get('/ranges/saved'),
    enabled: isSignedIn,
  })
  const { data: savedGunsmithsData } = useQuery({
    queryKey: ['gunsmiths', 'saved'],
    queryFn: () => api.get('/gunsmiths/saved'),
    enabled: isSignedIn,
  })
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', 'mine'],
    queryFn: () => api.get('/reviews/mine'),
    enabled: isSignedIn,
  })

  const savedRanges = savedRangesData?.data ?? []
  const savedGunsmiths = savedGunsmithsData?.data ?? []
  const myReviews = reviewsData?.data ?? []

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-100">Profile</h1>
        <p className="mt-2 text-stone-400">Sign in to see your saved ranges, gunsmiths, and reviews.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-100">Profile</h1>
      <p className="mt-1 text-stone-500">Your saved listings and reviews.</p>

      <section className="mt-8 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
        <h2 className="text-lg font-semibold text-stone-100 mb-4">Saved ranges</h2>
        {savedRanges.length === 0 ? (
          <p className="text-stone-500">No saved ranges. Save ranges from their detail pages.</p>
        ) : (
          <ul className="space-y-2">
            {savedRanges.map((r) => (
              <li key={r.id}>
                <Link to={`/ranges/${r.slug}`} className="text-accent hover:text-accent-light font-medium">
                  {r.name}
                </Link>
                <span className="text-stone-500 text-sm ml-2">{r.city}, {r.state}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
        <h2 className="text-lg font-semibold text-stone-100 mb-4">Saved gunsmiths</h2>
        {savedGunsmiths.length === 0 ? (
          <p className="text-stone-500">No saved gunsmiths. Save gunsmiths from their detail pages.</p>
        ) : (
          <ul className="space-y-2">
            {savedGunsmiths.map((g) => (
              <li key={g.id}>
                <Link to={`/gunsmiths/${g.slug}`} className="text-accent hover:text-accent-light font-medium">
                  {g.shopName ?? g.name}
                </Link>
                <span className="text-stone-500 text-sm ml-2">{g.city}, {g.state}</span>
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-surface-muted text-stone-400">
                  {FOCUS_LABELS[g.primaryFocus] ?? g.primaryFocus}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
        <h2 className="text-lg font-semibold text-stone-100 mb-4">My reviews</h2>
        {myReviews.length === 0 ? (
          <p className="text-stone-500">You haven&apos;t submitted any reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {myReviews.map((rev) => (
              <li key={rev.id} className="border-b border-stone-700 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Stars rating={rev.rating} />
                  {rev.range && (
                    <Link to={`/ranges/${rev.range.slug}`} className="text-accent hover:underline font-medium">
                      {rev.range.name}
                    </Link>
                  )}
                  {rev.gunsmith && (
                    <Link to={`/gunsmiths/${rev.gunsmith.slug}`} className="text-accent hover:underline font-medium">
                      {rev.gunsmith.shopName ?? rev.gunsmith.name}
                    </Link>
                  )}
                </div>
                <p className="text-stone-400 text-sm mt-1 line-clamp-2">{rev.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
        <h2 className="text-lg font-semibold text-stone-100 mb-2">NFA submissions</h2>
        <p className="text-stone-500 text-sm mb-3">Track your Form 4 / eForm 4 wait times and contribute to the community average.</p>
        <Link to="/nfa-tracker" className="inline-block px-4 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light">
          NFA Tracker →
        </Link>
      </section>

      <p className="mt-8 text-sm text-stone-500">
        Gunsmith owner? <Link to="/dashboard/gunsmiths" className="text-accent hover:underline">Open your dashboard</Link> to manage listings.
      </p>
    </div>
  )
}
