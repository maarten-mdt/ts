/**
 * Google Places integration.
 * Requires GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY with Places enabled).
 *
 * findPlaceByName(name, address) — Text Search API, returns place_id, rating, user_ratings_total
 * refreshRatingById(googlePlaceId) — Details API, returns current rating and review count
 */

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY
const BASE = 'https://maps.googleapis.com/maps/api/place'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google Places API error: ${res.status}`)
  const data = await res.json()
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API: ${data.status}`)
  }
  return data
}

/**
 * Find a place by name and address. Returns place_id, rating, user_ratings_total.
 */
export async function findPlaceByName(name, address) {
  if (!PLACES_API_KEY) return null
  try {
    const query = encodeURIComponent(`${name} ${address}`)
    const url = `${BASE}/textsearch/json?query=${query}&key=${PLACES_API_KEY}`
    const data = await fetchJson(url)
    const place = data.results?.[0]
    if (!place) return null
    return {
      placeId: place.place_id,
      rating: place.rating ?? null,
      userRatingsTotal: place.user_ratings_total ?? null,
    }
  } catch (err) {
    console.error('[googlePlaces.findPlaceByName]', err)
    return null
  }
}

/**
 * Refresh rating for a place by its Google Place ID.
 */
export async function refreshRatingById(googlePlaceId) {
  if (!PLACES_API_KEY) return null
  try {
    const url = `${BASE}/details/json?place_id=${googlePlaceId}&fields=rating,user_ratings_total&key=${PLACES_API_KEY}`
    const data = await fetchJson(url)
    const result = data.result
    if (!result) return null
    return {
      rating: result.rating ?? null,
      userRatingsTotal: result.user_ratings_total ?? null,
    }
  } catch (err) {
    console.error('[googlePlaces.refreshRatingById]', err)
    return null
  }
}
