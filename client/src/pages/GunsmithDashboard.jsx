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
      <span className="ml-1 text-stone-400">({Number(rating).toFixed(1)})</span>
    </span>
  )
}

export default function GunsmithDashboard() {
  const { api, isSignedIn } = useApi()

  const { data, isLoading, error } = useQuery({
    queryKey: ['gunsmiths', 'mine'],
    queryFn: () => api.get('/gunsmiths/mine'),
    enabled: isSignedIn,
  })

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-100 mb-4">Gunsmith dashboard</h1>
        <p className="text-stone-400">Sign in to manage your gunsmith listings.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-100 mb-4">Your gunsmith listings</h1>
        <p className="text-stone-500">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-100 mb-4">Your gunsmith listings</h1>
        <p className="text-red-400">{error.message}</p>
      </div>
    )
  }

  const gunsmiths = data?.data ?? []

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-100 mb-2">Your gunsmith listings</h1>
      <p className="text-stone-500 mb-6">Manage your claimed gunsmith profiles and FFL information.</p>

      {gunsmiths.length === 0 ? (
        <div className="p-8 rounded-lg border border-stone-700 bg-surface-elevated text-center">
          <p className="text-stone-400 mb-4">You haven&apos;t claimed any gunsmith listings yet.</p>
          <p className="text-stone-500 text-sm mb-6">Find your shop on TacticalShack and claim it to manage your listing and FFL.</p>
          <Link
            to="/gunsmiths"
            className="inline-block px-4 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light"
          >
            Find a gunsmith to claim →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {gunsmiths.map((g) => {
            const displayName = g.shopName ?? g.name
            const rating = g.googleRating ?? g.ourRating
            const fflExpiry = g.fflExpiry ? new Date(g.fflExpiry) : null
            const now = new Date()
            const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
            const fflExpiringSoon = g.hasFfl && fflExpiry && fflExpiry <= sixtyDays && fflExpiry >= now
            const fflExpired = g.hasFfl && fflExpiry && fflExpiry < now

            return (
              <li
                key={g.id}
                className="p-5 rounded-lg border border-stone-700 bg-surface-elevated hover:border-stone-600 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-100">
                      <Link to={`/gunsmiths/${g.slug}`} className="hover:text-accent">
                        {displayName}
                      </Link>
                    </h2>
                    <p className="text-stone-500 text-sm mt-0.5">
                      {g.city}, {g.state}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      <span className="px-2 py-0.5 rounded bg-surface-muted text-stone-400">
                        {FOCUS_LABELS[g.primaryFocus] ?? g.primaryFocus}
                      </span>
                      {g.ourReviewCount > 0 && (
                        <span className="text-stone-400">
                          <Stars rating={rating} /> {g.ourReviewCount} reviews
                        </span>
                      )}
                      {g.hasFfl && (
                        <span className={g.fflVerified ? 'text-green-500' : 'text-stone-500'}>
                          {g.fflVerified ? '✓ FFL verified' : 'FFL unverified'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/gunsmiths/${g.slug}`}
                      className="px-3 py-1.5 rounded text-sm font-medium text-stone-300 hover:text-stone-100 bg-surface-muted hover:bg-stone-600"
                    >
                      View
                    </Link>
                    <Link
                      to={`/dashboard/gunsmiths/${g.id}/edit`}
                      className="px-3 py-1.5 rounded text-sm font-medium bg-accent text-white hover:bg-accent-light"
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                {(fflExpiringSoon || fflExpired) && (
                  <div
                    className={`mt-4 p-3 rounded text-sm ${
                      fflExpired ? 'bg-red-900/30 border border-red-800 text-red-200' : 'bg-amber-900/30 border border-amber-800 text-amber-200'
                    }`}
                  >
                    {fflExpired
                      ? `FFL expired on ${fflExpiry.toLocaleDateString()}. Update your license and re-verify with admin.`
                      : `FFL expires on ${fflExpiry.toLocaleDateString()} (within 60 days). Consider renewing and re-verifying.`}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
