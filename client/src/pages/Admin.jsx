import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/useApi'

export default function Admin() {
  const { api, isSignedIn } = useApi()
  const queryClient = useQueryClient()
  const [rejectNote, setRejectNote] = useState('')
  const [rejectingId, setRejectingId] = useState(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'claims'],
    queryFn: () => api.get('/admin/claims'),
    enabled: isSignedIn,
  })

  const approveMutation = useMutation({
    mutationFn: (id) => api.patch(`/claims/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'claims'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNote }) => api.patch(`/claims/${id}/reject`, { adminNote: adminNote || undefined }),
    onSuccess: () => {
      setRejectingId(null)
      setRejectNote('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'claims'] })
    },
  })

  if (!isSignedIn) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Admin</h1>
        <p className="mt-2 text-stone-500">Sign in to access the admin dashboard.</p>
      </div>
    )
  }

  if (error) {
    const msg = error?.message ?? 'Failed to load claims'
    const isForbidden = msg.includes('403') || msg.includes('Forbidden') || msg.includes('Admin')
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Admin</h1>
        <p className="mt-2 text-red-400">{msg}</p>
        {isForbidden && (
          <p className="mt-1 text-stone-500">Admin access required.</p>
        )}
      </div>
    )
  }

  const claims = data?.data ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100">Admin</h1>
      <p className="mt-2 text-stone-500">Manage range claims and admin tasks.</p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-stone-200">Pending claims</h2>
        {isLoading ? (
          <p className="mt-2 text-stone-500">Loading claims...</p>
        ) : claims.length === 0 ? (
          <p className="mt-2 text-stone-500">No pending claims.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {claims.map((claim) => (
              <li
                key={claim.id}
                className="rounded-lg border border-stone-700 bg-surface-elevated p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-stone-100">{claim.range?.name}</h3>
                    <p className="mt-1 text-sm text-stone-400">
                      {claim.claimantName} — {claim.claimantTitle} — {claim.claimantEmail}
                    </p>
                    {claim.verificationNote && (
                      <p className="mt-1 text-sm text-stone-500">{claim.verificationNote}</p>
                    )}
                    <Link
                      to={`/ranges/${claim.range?.slug}`}
                      className="mt-2 inline-block text-sm text-accent hover:text-accent-light"
                    >
                      View range →
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {rejectingId === claim.id ? (
                      <>
                        <input
                          type="text"
                          placeholder="Reject reason (optional)"
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          className="rounded border border-stone-600 bg-surface px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:border-accent focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              rejectMutation.mutate({ id: claim.id, adminNote: rejectNote })
                            }
                            disabled={rejectMutation.isPending}
                            className="rounded px-3 py-2 text-sm font-medium bg-red-600/80 text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            Confirm reject
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRejectingId(null); setRejectNote('') }}
                            className="rounded px-3 py-2 text-sm font-medium text-stone-400 hover:text-stone-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(claim.id)}
                          disabled={approveMutation.isPending}
                          className="rounded px-3 py-2 text-sm font-medium bg-green-600/80 text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingId(claim.id)}
                          disabled={rejectMutation.isPending}
                          className="rounded px-3 py-2 text-sm font-medium border border-stone-600 text-stone-300 hover:bg-surface-muted hover:text-stone-100"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
