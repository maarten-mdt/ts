import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import RangeReviews from '../components/RangeReviews'

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
      <span className="ml-1 text-stone-400">({rating.toFixed(1)})</span>
    </span>
  )
}

export default function RangeDetail() {
  const { slug } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['range', slug],
    queryFn: () => api.get(`/ranges/${slug}`),
  })

  const range = data?.data

  if (isLoading) {
    return (
      <div>
        <Link to="/ranges" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
          ← Back to ranges
        </Link>
        <p className="text-stone-500">Loading...</p>
      </div>
    )
  }

  if (error || !range) {
    return (
      <div>
        <Link to="/ranges" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
          ← Back to ranges
        </Link>
        <p className="text-red-400">Range not found.</p>
      </div>
    )
  }

  const address = `${range.address}, ${range.city}, ${range.state} ${range.zip}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  const googleMapsUrl = range.googlePlaceId
    ? `https://www.google.com/maps/place/?q=place_id:${range.googlePlaceId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  return (
    <div>
      <Link to="/ranges" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
        ← Back to ranges
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-100 flex items-center gap-2">
          {range.name}
          {range.verified && (
            <span className="text-sm px-2 py-1 rounded bg-accent/20 text-accent">Verified</span>
          )}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-stone-400">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-light"
          >
            {address}
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            Get Directions →
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <span className="text-2xl font-bold text-accent">{range.maxDistanceYards} yd</span>
          <span className="px-2 py-1 rounded bg-surface-muted text-stone-300">{range.rangeType}</span>
          {range.dayFeeAvailable && (
            <span className="text-stone-400">
              Day fee{range.dayFeeAmount != null ? ` $${Number(range.dayFeeAmount)}` : ' available'}
            </span>
          )}
          {range.membershipRequired && (
            <span className="text-stone-400">Membership required</span>
          )}
        </div>
        <div className="mt-2">
          {range.googleRating != null ? (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-200"
            >
              <Stars rating={range.googleRating} />
              <span>{range.googleReviewCount} Google reviews</span>
            </a>
          ) : (
            <span className="text-stone-500">No Google rating</span>
          )}
          {range.ourReviewCount > 0 && (
            <span className="ml-4 text-stone-400">
              Our rating: <Stars rating={range.ourRating} /> ({range.ourReviewCount} reviews)
            </span>
          )}
        </div>
      </header>

      {range.heroPhoto || (range.photos?.length > 0) ? (
        <div className="mb-8 rounded-lg overflow-hidden border border-stone-700">
          <img
            src={range.heroPhoto ?? range.photos[0]}
            alt={range.name}
            className="w-full h-64 object-cover"
          />
        </div>
      ) : (
        <div className="mb-8 rounded-lg border border-stone-700 bg-surface-muted h-48 flex items-center justify-center text-stone-600">
          No photo
        </div>
      )}

      <div className="mb-8">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${range.lat},${range.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-stone-700 bg-surface-muted h-48 flex items-center justify-center text-accent hover:bg-surface-elevated transition-colors"
        >
          View on Google Maps →
        </a>
      </div>

      <div className="space-y-8">
        {range.description && (
          <section>
            <h2 className="text-lg font-semibold text-stone-100 mb-2">Description</h2>
            <p className="text-stone-400 whitespace-pre-wrap">{range.description}</p>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold text-stone-100 mb-2">Shooting Conditions</h2>
          <ul className="text-stone-400 space-y-1">
            <li>Max distance: {range.maxDistanceYards} yards</li>
            {range.numberOfLanes != null && <li>Lanes: {range.numberOfLanes}</li>}
            {range.surfaceTypes?.length > 0 && (
              <li>Surface: {range.surfaceTypes.join(', ')}</li>
            )}
            <li>Prone allowed: {range.proneAllowed ? 'Yes' : 'No'}</li>
            <li>Covered positions: {range.coveredPositions ? 'Yes' : 'No'}</li>
            {range.benchRests && (
              <li>Bench rests{range.numberOfBenches != null ? ` (${range.numberOfBenches})` : ''}</li>
            )}
            <li>Cold range only: {range.coldRangeOnly ? 'Yes' : 'No'}</li>
            <li>RO required: {range.rfOfficerRequired ? 'Yes' : 'No'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100 mb-2">Rules & Access</h2>
          <ul className="text-stone-400 space-y-1">
            <li>Membership required: {range.membershipRequired ? 'Yes' : 'No'}</li>
            {range.membershipFeeAnnual != null && (
              <li>Annual fee: ${Number(range.membershipFeeAnnual)}</li>
            )}
            <li>Day fee: {range.dayFeeAvailable ? 'Yes' : 'No'}</li>
            {range.dayFeeAmount != null && <li>Day fee amount: ${Number(range.dayFeeAmount)}</li>}
            <li>Steel targets: {range.steelTargetsAllowed ? 'Allowed' : 'No'}</li>
            {range.magRestrictions && <li>Restrictions: {range.magRestrictions}</li>}
            <li>Suppressor friendly: {range.suppressorFriendly ? 'Yes' : 'No'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-100 mb-2">Facilities</h2>
          <ul className="text-stone-400 space-y-1">
            <li>Restrooms: {range.restroomsOnSite ? 'Yes' : 'No'}</li>
            <li>Parking: {range.parkingAvailable ? 'Yes' : 'No'}</li>
            <li>Roofed shooting: {range.roofedShooting ? 'Yes' : 'No'}</li>
            <li>Night shooting: {range.lightingAvailable ? 'Yes' : 'No'}</li>
            <li>Target rentals: {range.targetRentals ? 'Yes' : 'No'}</li>
            <li>Ammo available: {range.ammoAvailable ? 'Yes' : 'No'}</li>
            <li>Gun rentals: {range.gunRentals ? 'Yes' : 'No'}</li>
            <li>Classes: {range.classesOffered ? 'Yes' : 'No'}</li>
            <li>FFL on site: {range.fflOnSite ? 'Yes' : 'No'}</li>
          </ul>
        </section>

        {range.hostsMatches && (
          <section>
            <h2 className="text-lg font-semibold text-stone-100 mb-2">Matches & Competitions</h2>
            <p className="text-stone-400">
              Hosts matches: {range.matchTypes?.length ? range.matchTypes.join(', ') : 'Yes'}
            </p>
            {range.matchScheduleUrl && (
              <a
                href={range.matchScheduleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline mt-2 inline-block"
              >
                View match schedule →
              </a>
            )}
          </section>
        )}

        {(range.hoursNotes || range.seasonalClosure) && (
          <section>
            <h2 className="text-lg font-semibold text-stone-100 mb-2">Hours</h2>
            <p className="text-stone-400">{range.hoursNotes ?? 'Contact for hours'}</p>
            {range.seasonalClosure && (
              <p className="text-stone-500 mt-2">Seasonal closure: {range.seasonalNotes ?? 'Yes'}</p>
            )}
          </section>
        )}

        {(range.website || range.phone || range.email) && (
          <section>
            <h2 className="text-lg font-semibold text-stone-100 mb-2">Contact</h2>
            <ul className="text-stone-400 space-y-1">
              {range.website && (
                <li>
                  <a href={range.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {range.website}
                  </a>
                </li>
              )}
              {range.phone && <li>Phone: {range.phone}</li>}
              {range.email && <li>Email: {range.email}</li>}
            </ul>
          </section>
        )}

        <RangeReviews range={range} />
      </div>

      {!range.claimed && (
        <div className="mt-8 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
          <p className="text-stone-300 mb-2">
            Is this your range? Claim this listing to manage your information, respond to reviews, and add photos.
          </p>
          <Link
            to={`/ranges/${range.slug}/claim`}
            className="inline-block px-4 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light"
          >
            Claim This Range →
          </Link>
        </div>
      )}

      <p className="mt-8 text-sm text-stone-600">
        Last updated: {new Date(range.updatedAt).toLocaleDateString()}
      </p>
    </div>
  )
}
