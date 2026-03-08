import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

const RANGE_TYPES = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'CLUB', label: 'Club' },
  { value: 'COMMERCIAL', label: 'Commercial' },
]
const DISTANCE_OPTIONS = [100, 200, 300, 500, 600, 1000]
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Highest Rated' },
]

function RangeCard({ range }) {
  const features = []
  if (range.steelTargetsAllowed) features.push('Steel OK')
  if (range.proneAllowed) features.push('Prone')
  if (range.coveredPositions) features.push('Covered')
  if (range.hostsMatches && range.matchTypes?.length)
    features.push(`Hosts ${range.matchTypes[0]}`)

  return (
    <Link
      to={`/ranges/${range.slug}`}
      className="block p-6 rounded-lg border border-stone-700 bg-surface-elevated hover:border-stone-600 transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-stone-100 flex items-center gap-2">
            {range.name}
            {range.verified && (
              <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">Verified</span>
            )}
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            {range.city}, {range.state}
          </p>
        </div>
        <span className="text-2xl font-bold text-accent">{range.maxDistanceYards} yd</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs px-2 py-1 rounded bg-surface-muted text-stone-400">
          {range.rangeType}
        </span>
        {features.map((f) => (
          <span key={f} className="text-xs px-2 py-1 rounded bg-surface-muted text-stone-400">
            {f}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-stone-400">
          {range.googleRating != null ? (
            <>★ {range.googleRating.toFixed(1)} ({range.googleReviewCount} Google)</>
          ) : (
            <span className="text-stone-600">No Google rating</span>
          )}
        </span>
        {range.dayFeeAvailable && (
          <span className="text-stone-400">
            Day fee
            {range.dayFeeAmount != null && ` $${Number(range.dayFeeAmount)}`}
          </span>
        )}
      </div>
      {!range.claimed && (
        <p className="mt-3 text-xs text-accent">Is this your range? Claim it</p>
      )}
    </Link>
  )
}

export default function Ranges() {
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [minDistance, setMinDistance] = useState('')
  const [rangeTypes, setRangeTypes] = useState([])
  const [steelAllowed, setSteelAllowed] = useState(false)
  const [proneAllowed, setProneAllowed] = useState(false)
  const [covered, setCovered] = useState(false)
  const [membershipRequired, setMembershipRequired] = useState(false)
  const [hostsMatches, setHostsMatches] = useState(false)
  const [suppressorFriendly, setSuppressorFriendly] = useState(false)
  const [verified, setVerified] = useState(false)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const params = {
    page,
    limit: 20,
    sort,
  }
  if (search) params.search = search
  if (state) params.state = state
  if (minDistance) params.minDistance = minDistance
  if (rangeTypes.length) params.rangeTypes = rangeTypes.join(',')
  if (steelAllowed) params.steelAllowed = true
  if (proneAllowed) params.proneAllowed = true
  if (covered) params.covered = true
  if (membershipRequired) params.membershipRequired = true
  if (hostsMatches) params.hostsMatches = true
  if (suppressorFriendly) params.suppressorFriendly = true
  if (verified) params.verified = true

  const { data, isLoading, error } = useQuery({
    queryKey: ['ranges', params],
    queryFn: () => api.get('/ranges', params),
  })

  const ranges = data?.data ?? []
  const meta = data?.meta ?? { total: 0, page: 1, limit: 20 }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100">Find a Range</h1>
      <p className="mt-2 text-stone-500">
        Search by location, max distance, and facilities.
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
              <label className="block text-sm font-medium text-stone-400 mb-1">
                Min shooting distance (yd)
              </label>
              <select
                value={minDistance}
                onChange={(e) => setMinDistance(e.target.value)}
                className="w-full px-3 py-2 rounded border border-stone-700 bg-surface text-stone-100 outline-none focus:border-stone-600"
              >
                <option value="">Any</option>
                {DISTANCE_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}+ yards
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-2">Range type</label>
              <div className="space-y-2">
                {RANGE_TYPES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-stone-300">
                    <input
                      type="checkbox"
                      checked={rangeTypes.includes(value)}
                      onChange={(e) =>
                        setRangeTypes((prev) =>
                          e.target.checked ? [...prev, value] : prev.filter((t) => t !== value)
                        )
                      }
                      className="rounded border-stone-600 bg-surface text-accent"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-stone-700">
              {[
                [steelAllowed, setSteelAllowed, 'Steel targets allowed'],
                [proneAllowed, setProneAllowed, 'Prone shooting'],
                [covered, setCovered, 'Covered positions'],
                [membershipRequired, setMembershipRequired, 'Membership required'],
                [hostsMatches, setHostsMatches, 'Hosts matches'],
                [suppressorFriendly, setSuppressorFriendly, 'Suppressor friendly'],
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
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <span className="text-stone-500">
              {meta.total} range{meta.total !== 1 ? 's' : ''} found
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded border border-stone-700 bg-surface text-stone-100 text-sm outline-none focus:border-stone-600"
            >
              {SORT_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <p className="text-stone-500">Loading ranges...</p>
          ) : error ? (
            <p className="text-red-400">Failed to load ranges. Is the API running?</p>
          ) : ranges.length === 0 ? (
            <p className="text-stone-500 py-12 text-center">
              No ranges match your filters. Try adjusting your search.
            </p>
          ) : (
            <div className="space-y-4">
              {ranges.map((range) => (
                <RangeCard key={range.id} range={range} />
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
