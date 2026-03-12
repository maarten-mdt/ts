import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { FOCUS_LABELS, SPECIALTY_LABELS, SPECIALTIES_BY_CATEGORY } from '../lib/gunsmithTaxonomy'

function GunsmithCard({ gunsmith }) {
  const displayName = gunsmith.shopName ?? gunsmith.name
  const features = []
  if (gunsmith.acceptsMailIn) features.push('Mail-in')
  if (gunsmith.fflVerified) features.push('✓ FFL Verified')
  if (gunsmith.rushJobsAvailable) features.push('Rush jobs')

  const rating = gunsmith.googleRating ?? gunsmith.ourRating
  return (
    <Link
      to={`/gunsmiths/${gunsmith.slug}`}
      className="block p-6 rounded-lg border border-stone-700 bg-surface-elevated hover:border-stone-600 transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-stone-100 flex items-center gap-2">
            {displayName}
            {gunsmith.verified && (
              <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">Verified</span>
            )}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            {gunsmith.city}, {gunsmith.state}
          </p>
        </div>
        <span className="px-2 py-1 rounded bg-surface-muted text-stone-300 text-sm">
          {FOCUS_LABELS[gunsmith.primaryFocus] ?? gunsmith.primaryFocus}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {gunsmith.specialties?.slice(0, 4).map((s) => (
          <span key={s} className="text-xs px-2 py-1 rounded bg-surface-muted text-stone-400">
            {SPECIALTY_LABELS[s] ?? s}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-stone-400">
          {rating != null ? (
            <>★ {Number(rating).toFixed(1)}</>
          ) : (
            <span className="text-stone-600">No rating</span>
          )}
          {gunsmith.avgTurnaroundWeeks != null && (
            <span className="ml-2 text-stone-500">~{gunsmith.avgTurnaroundWeeks} wk turnaround</span>
          )}
        </span>
        {features.length > 0 && (
          <span className="text-stone-500">{features.join(' · ')}</span>
        )}
      </div>
      {!gunsmith.claimed && (
        <p className="mt-3 text-xs text-accent">Is this your shop? Claim it</p>
      )}
    </Link>
  )
}

export default function Gunsmiths() {
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [primaryFocus, setPrimaryFocus] = useState('')
  const [specialties, setSpecialties] = useState([])
  const [acceptsMailIn, setAcceptsMailIn] = useState(false)
  const [hasFfl, setHasFfl] = useState(false)
  const [fflVerified, setFflVerified] = useState(false)
  const [maxTurnaroundWeeks, setMaxTurnaroundWeeks] = useState('')
  const [verified, setVerified] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const params = { page, limit: 20, sort }
  if (search) params.search = search
  if (state) params.state = state
  if (city) params.city = city
  if (primaryFocus) params.primaryFocus = primaryFocus
  if (specialties.length) params.specialties = specialties.join(',')
  if (acceptsMailIn) params.acceptsMailIn = true
  if (hasFfl) params.hasFfl = true
  if (fflVerified) params.fflVerified = true
  if (maxTurnaroundWeeks) params.maxTurnaroundWeeks = maxTurnaroundWeeks
  if (verified) params.verified = true

  const { data, isLoading, error } = useQuery({
    queryKey: ['gunsmiths', params],
    queryFn: () => api.get('/gunsmiths', params),
  })

  const gunsmiths = data?.data ?? []
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20 }

  const toggleSpecialty = (code) => {
    setSpecialties((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100">Find a Gunsmith</h1>
      <p className="mt-2 text-stone-500">
        Search by specialty, focus area, and service options.
      </p>

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          <div className="rounded-lg border border-stone-700 bg-surface-elevated p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Search</label>
              <input
                type="text"
                placeholder="Name, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded border border-stone-700 bg-surface text-stone-100 placeholder-stone-500 outline-none focus:border-stone-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">State / Province</label>
              <input
                type="text"
                placeholder="e.g. BC, ID"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded border border-stone-700 bg-surface text-stone-100 placeholder-stone-500 outline-none focus:border-stone-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">City</label>
              <input
                type="text"
                placeholder="e.g. Boise"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded border border-stone-700 bg-surface text-stone-100 placeholder-stone-500 outline-none focus:border-stone-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-2">Focus area</label>
              <select
                value={primaryFocus}
                onChange={(e) => setPrimaryFocus(e.target.value)}
                className="w-full px-3 py-2 rounded border border-stone-700 bg-surface text-stone-100 outline-none focus:border-stone-600"
              >
                <option value="">All</option>
                {Object.entries(FOCUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-2">Specialties</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(SPECIALTIES_BY_CATEGORY).map(([cat, codes]) => (
                  <div key={cat}>
                    <span className="text-xs text-stone-500 uppercase">{cat}</span>
                    <div className="mt-1 space-y-1">
                      {codes.map((code) => (
                        <label key={code} className="flex items-center gap-2 text-sm text-stone-300">
                          <input
                            type="checkbox"
                            checked={specialties.includes(code)}
                            onChange={() => toggleSpecialty(code)}
                            className="rounded border-stone-600 bg-surface text-accent"
                          />
                          {SPECIALTY_LABELS[code] ?? code}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-700">
              {[
                [acceptsMailIn, setAcceptsMailIn, 'Accepts mail-in'],
                [hasFfl, setHasFfl, 'Has active FFL'],
                [fflVerified, setFflVerified, 'FFL verified'],
                [verified, setVerified, 'Verified only'],
              ].map(([checked, setter, label]) => (
                <label key={label} className="flex items-center gap-2 text-sm text-stone-300">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setter(e.target.checked)}
                    className="rounded border-stone-600 bg-surface text-accent"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Max turnaround (weeks)</label>
              <select
                value={maxTurnaroundWeeks}
                onChange={(e) => setMaxTurnaroundWeeks(e.target.value)}
                className="w-full px-3 py-2 rounded border border-stone-700 bg-surface text-stone-100 outline-none focus:border-stone-600"
              >
                <option value="">Any</option>
                {[2, 4, 8, 12].map((w) => (
                  <option key={w} value={w}>{w} weeks</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className="text-stone-500">
              {meta.total} gunsmith{meta.total !== 1 ? 's' : ''} found
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded border border-stone-700 bg-surface text-stone-100 text-sm outline-none focus:border-stone-600"
            >
              <option value="newest">Newest</option>
              <option value="name">Name</option>
              <option value="rating">Highest rated</option>
              <option value="turnaround">Fastest turnaround</option>
            </select>
          </div>

          {isLoading ? (
            <p className="text-stone-500">Loading gunsmiths...</p>
          ) : error ? (
            <p className="text-red-400">Failed to load gunsmiths.</p>
          ) : gunsmiths.length === 0 ? (
            <p className="text-stone-500 py-12 text-center">
              No gunsmiths match your filters. Try adjusting your search.
            </p>
          ) : (
            <div className="space-y-4">
              {gunsmiths.map((g) => (
                <GunsmithCard key={g.id} gunsmith={g} />
              ))}
            </div>
          )}

          {meta.total > meta.limit && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded border border-stone-700 bg-surface-elevated text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-muted"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-stone-500">
                Page {page} of {Math.ceil(meta.total / meta.limit)}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(meta.total / meta.limit)}
                className="px-4 py-2 rounded border border-stone-700 bg-surface-elevated text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-muted"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
