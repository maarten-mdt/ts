import { useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_BASE = '/api'

/**
 * Returns an API client that automatically adds the Clerk session token
 * when the user is signed in (for protected routes like claims, reviews).
 */
export function useApi() {
  const { getToken, isSignedIn } = useAuth()

  const request = useCallback(
    async (path, options = {}) => {
      const url = path.startsWith('http') ? path : `${API_BASE}${path}`
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }
      if (isSignedIn) {
        try {
          const token = await getToken()
          if (token) headers.Authorization = `Bearer ${token}`
        } catch (_) {}
      }
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed: ${res.status}`)
      }
      return data
    },
    [getToken, isSignedIn]
  )

  const api = {
    get: (path, params) => {
      const search = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(path + search)
    },
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: 'DELETE' }),
  }

  return { api, isSignedIn }
}
