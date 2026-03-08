const API_BASE = '/api'

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`)
  }
  return data
}

export const api = {
  get: (path, params) => {
    const search = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(path + search)
  },
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
