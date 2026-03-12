import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/useApi'
import GunsmithReviews from '../components/GunsmithReviews'
import { FOCUS_LABELS, SPECIALTY_LABELS } from '../lib/gunsmithTaxonomy'

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

const FFL_LICENSE_LABELS = {
  TYPE_01: 'Type 01 — Dealer',
  TYPE_02: 'Type 02 — Pawnbroker',
  TYPE_06: 'Type 06 — Ammo manufacturer',
  TYPE_07: 'Type 07 — Firearms manufacturer',
  TYPE_08: 'Type 08 — Importer',
  TYPE_09: 'Type 09 — Destructive devices dealer',
  TYPE_10: 'Type 10 — Destructive devices manufacturer',
  TYPE_11: 'Type 11 — Destructive devices importer',
  SOT_02: 'SOT Class 2 — NFA manufacturer',
  SOT_03: 'SOT Class 3 — NFA dealer',
}

export default function GunsmithDetail() {
  const { slug } = useParams()
  const { api, isSignedIn } = useApi()
  const queryClient = useQueryClient()
  const [fflRequested, setFflRequested] = useState(false)
  const fflUploadRef = useRef(null)
  const photosUploadRef = useRef(null)

  const invalidateGunsmith = () => {
    queryClient.invalidateQueries({ queryKey: ['gunsmith', slug] })
  }

  const fflRequestMutation = useMutation({
    mutationFn: (id) => api.post(`/gunsmiths/${id}/ffl-request`),
    onSuccess: () => {
      setFflRequested(true)
      invalidateGunsmith()
    },
  })

  const fflUploadMutation = useMutation({
    mutationFn: async (file) => {
      const form = new FormData()
      form.append('file', file)
      return api.postForm(`/gunsmiths/${g?.id}/ffl-upload`, form)
    },
    onSuccess: invalidateGunsmith,
  })

  const fflRemoveMutation = useMutation({
    mutationFn: () => api.delete(`/gunsmiths/${g?.id}/ffl`),
    onSuccess: invalidateGunsmith,
  })

  const photosUploadMutation = useMutation({
    mutationFn: async (files) => {
      const form = new FormData()
      for (let i = 0; i < files.length; i++) form.append('photos', files[i])
      return api.postForm(`/gunsmiths/${g?.id}/photos`, form)
    },
    onSuccess: invalidateGunsmith,
  })

  const photoRemoveMutation = useMutation({
    mutationFn: (url) => api.delete(`/gunsmiths/${g?.id}/photos`, { url }),
    onSuccess: invalidateGunsmith,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['gunsmith', slug],
    queryFn: () => api.get(`/gunsmiths/${slug}`),
  })

  const g = data?.data

  if (isLoading) {
    return (
      <div>
        <Link to="/gunsmiths" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">← Back to gunsmiths</Link>
        <p className="text-stone-500">Loading...</p>
      </div>
    )
  }

  if (error || !g) {
    return (
      <div>
        <Link to="/gunsmiths" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">← Back to gunsmiths</Link>
        <p className="text-red-400">Gunsmith not found.</p>
      </div>
    )
  }

  const address = `${g.address}, ${g.city}, ${g.state} ${g.zip}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  const mapsUrl = g.googlePlaceId
    ? `https://www.google.com/maps/place/?q=place_id:${g.googlePlaceId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  const displayName = g.shopName ?? g.name
  const rating = g.googleRating ?? g.ourRating
  const isUS = g.country === 'US'

  return (
    <div>
      <Link to="/gunsmiths" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">← Back to gunsmiths</Link>

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-100 flex items-center gap-2">
          {displayName}
          {g.verified && <span className="text-sm px-2 py-1 rounded bg-accent/20 text-accent">Verified</span>}
          <span className="px-2 py-1 rounded bg-surface-muted text-stone-300 text-sm">
            {FOCUS_LABELS[g.primaryFocus] ?? g.primaryFocus}
          </span>
        </h1>
        {g.shopName && g.name !== g.shopName && (
          <p className="text-stone-500 mt-0.5">Operated by {g.name}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-stone-400">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light">
            {address}
          </a>
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
            Get Directions →
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {g.avgTurnaroundWeeks != null && (
            <span className="text-stone-400">~{g.avgTurnaroundWeeks} week turnaround</span>
          )}
          {g.yearsExperience != null && (
            <span className="text-stone-400">{g.yearsExperience} years experience</span>
          )}
          {g.acceptsMailIn && (
            <span className="px-2 py-1 rounded bg-surface-muted text-stone-300">Accepts mail-in</span>
          )}
        </div>
        {(rating != null || g.ourReviewCount > 0) && (
          <div className="mt-2">
            {rating != null && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-200">
                <Stars rating={rating} />
                {g.googleReviewCount != null && <span>{g.googleReviewCount} Google reviews</span>}
              </a>
            )}
            {g.ourReviewCount > 0 && (
              <span className="ml-4 text-stone-400">
                Our rating: <Stars rating={g.ourRating} /> ({g.ourReviewCount} reviews)
              </span>
            )}
          </div>
        )}
      </header>

      {(g.heroPhoto || (g.photos?.length > 0)) && (
        <div className="mb-8 rounded-lg overflow-hidden border border-stone-700">
          <img src={g.heroPhoto ?? g.photos[0]} alt={displayName} className="w-full h-64 object-cover" />
        </div>
      )}

      <div className="mb-8">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${g.lat},${g.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-stone-700 bg-surface-muted h-48 flex items-center justify-center text-accent hover:bg-surface-elevated transition-colors"
        >
          View on Google Maps →
        </a>
      </div>

      <div className="space-y-8">
        {g.bio && (
          <section>
            <h2 className="text-lg font-semibold text-stone-100 mb-2">About</h2>
            <p className="text-stone-400 whitespace-pre-wrap">{g.bio}</p>
            {g.credentials?.length > 0 && (
              <div className="mt-3">
                <span className="text-stone-500">Credentials: </span>
                <span className="text-stone-400">{g.credentials.join(', ')}</span>
              </div>
            )}
            {g.platformsServiced?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {g.platformsServiced.map((p) => (
                  <span key={p} className="text-xs px-2 py-1 rounded bg-surface-muted text-stone-400">{p}</span>
                ))}
              </div>
            )}
          </section>
        )}

        {g.specialties?.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-stone-100 mb-2">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {g.specialties.map((s) => (
                <span key={s} className="text-sm px-2 py-1 rounded bg-surface-muted text-stone-300" title={SPECIALTY_LABELS[s]}>
                  {SPECIALTY_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-stone-100 mb-2">Service & Pricing</h2>
          <ul className="text-stone-400 space-y-1">
            <li>Accepts mail-in: {g.acceptsMailIn ? 'Yes' : 'No'}</li>
            <li>Mail-in only: {g.mailInOnly ? 'Yes' : 'No'}</li>
            <li>Rush jobs: {g.rushJobsAvailable ? 'Yes' : 'No'}</li>
            {g.avgTurnaroundWeeks != null && <li>Typical turnaround: ~{g.avgTurnaroundWeeks} weeks</li>}
            {g.turnaroundNotes && <li className="text-stone-500">{g.turnaroundNotes}</li>}
            {g.laborRatePerHour != null && <li>Labor: ${Number(g.laborRatePerHour)}/hr</li>}
            {g.pricingNotes && <li>{g.pricingNotes}</li>}
          </ul>
          {g.bookingUrl && (
            <a href={g.bookingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block px-4 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light">
              Book Online →
            </a>
          )}
        </section>

        {isUS && g.hasFfl && (
          <section>
            <h2 className="text-lg font-semibold text-stone-100 mb-2">FFL Information</h2>
            <div className="p-4 rounded-lg border border-stone-700 bg-surface-elevated space-y-2">
              <p>
                <span className="text-stone-500">Status: </span>
                {g.fflVerified ? (
                  g.fflExpiry && new Date(g.fflExpiry) < new Date() ? (
                    <span className="text-amber-400">Expired</span>
                  ) : (
                    <span className="text-green-500">✓ Active (verified)</span>
                  )
                ) : (
                  <span className="text-stone-400">Unverified — contact gunsmith directly</span>
                )}
              </p>
              {g.fflLicenseType && (
                <p><span className="text-stone-500">License type: </span>{FFL_LICENSE_LABELS[g.fflLicenseType] ?? g.fflLicenseType}</p>
              )}
              {g.fflNumberDisplay && (
                <p><span className="text-stone-500">License #: </span>{g.fflNumberDisplay}</p>
              )}
              {g.fflExpiry && (
                <p><span className="text-stone-500">Expires: </span>{new Date(g.fflExpiry).toLocaleDateString()}</p>
              )}
              {g.fflFileUrl && (
                g.fflAutoDownload ? (
                  <a
                    href={`/api/gunsmiths/${g.id}/ffl-download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 rounded bg-accent text-white font-medium text-sm hover:bg-accent-light"
                  >
                    Download FFL (for shipping) →
                  </a>
                ) : (
                  isSignedIn ? (
                    fflRequested ? (
                      <p className="mt-2 text-stone-500 text-sm">Request sent. The gunsmith will be notified.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fflRequestMutation.mutate(g.id)}
                        disabled={fflRequestMutation.isPending}
                        className="mt-2 px-4 py-2 rounded bg-accent text-white font-medium text-sm hover:bg-accent-light disabled:opacity-50"
                      >
                        {fflRequestMutation.isPending ? 'Sending...' : 'Request FFL →'}
                      </button>
                    )
                  ) : (
                    <p className="mt-2 text-stone-500 text-sm">Sign in to request the FFL document.</p>
                  )
                )
              )}
            </div>
          </section>
        )}

        {(g.website || g.phone || g.email) && (
          <section>
            <h2 className="text-lg font-semibold text-stone-100 mb-2">Contact</h2>
            <ul className="text-stone-400 space-y-1">
              {g.website && (
                <li><a href={g.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{g.website}</a></li>
              )}
              {g.phone && <li>Phone: {g.phone}</li>}
              {g.email && <li>Email: {g.email}</li>}
            </ul>
          </section>
        )}

        <GunsmithReviews gunsmith={g} />
      </div>

      {g.canEdit && (
        <div className="mt-8 p-6 rounded-lg border border-stone-700 bg-surface-elevated space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/dashboard/gunsmiths/${g.id}/edit`} className="px-4 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light">
              Edit listing →
            </Link>
          </div>

          {isUS && (
            <div>
              <h3 className="text-sm font-semibold text-stone-300 mb-2">FFL document</h3>
              {g.fflFileUrl ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-stone-500 text-sm">PDF uploaded.</span>
                  <button
                    type="button"
                    onClick={() => fflRemoveMutation.mutate()}
                    disabled={fflRemoveMutation.isPending}
                    className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              <input
                ref={fflUploadRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) fflUploadMutation.mutate(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fflUploadRef.current?.click()}
                disabled={fflUploadMutation.isPending}
                className="mt-1 px-3 py-1.5 rounded border border-stone-600 text-stone-300 text-sm hover:bg-surface-muted disabled:opacity-50"
              >
                {fflUploadMutation.isPending ? 'Uploading...' : g.fflFileUrl ? 'Replace FFL (PDF)' : 'Upload FFL (PDF)'}
              </button>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-stone-300 mb-2">Photos</h3>
            <input
              ref={photosUploadRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files?.length) photosUploadMutation.mutate(Array.from(files))
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => photosUploadRef.current?.click()}
              disabled={photosUploadMutation.isPending}
              className="mb-3 px-3 py-1.5 rounded border border-stone-600 text-stone-300 text-sm hover:bg-surface-muted disabled:opacity-50"
            >
              {photosUploadMutation.isPending ? 'Uploading...' : 'Add photos'}
            </button>
            {(g.photos?.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {g.photos.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded border border-stone-600" />
                    <button
                      type="button"
                      onClick={() => photoRemoveMutation.mutate(url)}
                      disabled={photoRemoveMutation.isPending}
                      className="absolute inset-0 flex items-center justify-center rounded bg-black/60 opacity-0 group-hover:opacity-100 text-red-400 text-sm hover:text-red-300 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!g.claimed && !g.canEdit && (
        <div className="mt-8 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
          <p className="text-stone-300 mb-2">Is this your shop? Claim this listing to manage your information and FFL.</p>
          <Link to={`/gunsmiths/${g.slug}/claim`} className="inline-block px-4 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light">
            Claim This Listing →
          </Link>
        </div>
      )}

      <p className="mt-8 text-sm text-stone-600">Last updated: {new Date(g.updatedAt).toLocaleDateString()}</p>
    </div>
  )
}
