import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/useApi'

const TABS = ['Range Claims', 'Gunsmith Claims', 'Gunsmiths', 'FFL']

export default function Admin() {
  const { api, isSignedIn } = useApi()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('Range Claims')
  const [rejectNote, setRejectNote] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [gRejectingId, setGRejectingId] = useState(null)
  const [gRejectNote, setGRejectNote] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'claims'],
    queryFn: () => api.get('/admin/claims'),
    enabled: isSignedIn && tab === 'Range Claims',
  })

  const { data: gClaimsData } = useQuery({
    queryKey: ['admin', 'gunsmith-claims'],
    queryFn: () => api.get('/gunsmith-claims', { status: 'PENDING' }),
    enabled: isSignedIn && tab === 'Gunsmith Claims',
  })

  const { data: gunsmithsData } = useQuery({
    queryKey: ['admin', 'gunsmiths'],
    queryFn: () => api.get('/admin/gunsmiths'),
    enabled: isSignedIn && tab === 'Gunsmiths',
  })

  const { data: fflData } = useQuery({
    queryKey: ['admin', 'ffl'],
    queryFn: async () => {
      const [syncLog, expiring] = await Promise.all([
        api.get('/admin/ffl/sync-log'),
        api.get('/admin/ffl/expiring'),
      ])
      return { syncLog: syncLog?.data ?? [], expiring: expiring?.data ?? [] }
    },
    enabled: isSignedIn && tab === 'FFL',
  })

  const approveMutation = useMutation({
    mutationFn: (id) => api.patch(`/claims/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'claims'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNote }) => api.patch(`/claims/${id}/reject`, { adminNote: adminNote || undefined }),
    onSuccess: () => {
      setRejectingId(null)
      setRejectNote('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'claims'] })
    },
  })

  const gApproveMutation = useMutation({
    mutationFn: (id) => api.patch(`/gunsmith-claims/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'gunsmith-claims'] }),
  })

  const gRejectMutation = useMutation({
    mutationFn: ({ id, adminNote }) => api.patch(`/gunsmith-claims/${id}/reject`, { adminNote: adminNote || undefined }),
    onSuccess: () => {
      setGRejectingId(null)
      setGRejectNote('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'gunsmith-claims'] })
    },
  })

  const fflSyncMutation = useMutation({
    mutationFn: () => api.post('/admin/ffl/sync'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'ffl'] }),
  })

  if (!isSignedIn) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Admin</h1>
        <p className="mt-2 text-stone-500">Sign in to access the admin dashboard.</p>
      </div>
    )
  }

  if (error && tab === 'Range Claims') {
    const msg = error?.message ?? 'Failed to load'
    const isForbidden = msg.includes('403') || msg.includes('Forbidden') || msg.includes('Admin')
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-100">Admin</h1>
        <p className="mt-2 text-red-400">{msg}</p>
        {isForbidden && <p className="mt-1 text-stone-500">Admin access required.</p>}
      </div>
    )
  }

  const claims = data?.data ?? []
  const gClaims = gClaimsData?.data ?? []
  const gunsmiths = gunsmithsData?.data ?? []
  const fflSyncLog = fflData?.syncLog ?? []
  const fflExpiring = fflData?.expiring ?? []
  const lastSync = fflSyncLog[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-100">Admin</h1>
      <p className="mt-2 text-stone-500">Manage claims, gunsmiths, and FFL sync.</p>

      <div className="mt-6 flex gap-2 border-b border-stone-700">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Range Claims' && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-stone-200">Pending range claims</h2>
          {isLoading ? (
            <p className="mt-2 text-stone-500">Loading claims...</p>
          ) : claims.length === 0 ? (
            <p className="mt-2 text-stone-500">No pending claims.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {claims.map((claim) => (
                <li key={claim.id} className="rounded-lg border border-stone-700 bg-surface-elevated p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-stone-100">{claim.range?.name}</h3>
                      <p className="mt-1 text-sm text-stone-400">{claim.claimantName} — {claim.claimantTitle} — {claim.claimantEmail}</p>
                      {claim.verificationNote && <p className="mt-1 text-sm text-stone-500">{claim.verificationNote}</p>}
                      <Link to={`/ranges/${claim.range?.slug}`} className="mt-2 inline-block text-sm text-accent hover:text-accent-light">View range →</Link>
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
                          <button type="button" onClick={() => rejectMutation.mutate({ id: claim.id, adminNote: rejectNote })} disabled={rejectMutation.isPending} className="rounded px-3 py-2 text-sm font-medium bg-red-600/80 text-white hover:bg-red-600 disabled:opacity-50">Confirm reject</button>
                          <button type="button" onClick={() => { setRejectingId(null); setRejectNote('') }} className="rounded px-3 py-2 text-sm font-medium text-stone-400 hover:text-stone-200">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => approveMutation.mutate(claim.id)} disabled={approveMutation.isPending} className="rounded px-3 py-2 text-sm font-medium bg-green-600/80 text-white hover:bg-green-600 disabled:opacity-50">Approve</button>
                          <button type="button" onClick={() => setRejectingId(claim.id)} disabled={rejectMutation.isPending} className="rounded px-3 py-2 text-sm font-medium border border-stone-600 text-stone-300 hover:bg-surface-muted hover:text-stone-100">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'Gunsmith Claims' && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-stone-200">Pending gunsmith claims</h2>
          {gClaims.length === 0 ? (
            <p className="mt-2 text-stone-500">No pending gunsmith claims.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {gClaims.map((claim) => (
                <li key={claim.id} className="rounded-lg border border-stone-700 bg-surface-elevated p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-stone-100">{claim.gunsmith?.shopName ?? claim.gunsmith?.name}</h3>
                      <p className="mt-1 text-sm text-stone-400">{claim.claimantName} — {claim.claimantTitle} — {claim.claimantEmail}</p>
                      {claim.fflNumber && <p className="mt-1 text-sm text-stone-500">FFL: {claim.fflNumber}</p>}
                      {claim.verificationNote && <p className="mt-1 text-sm text-stone-500">{claim.verificationNote}</p>}
                      <Link to={`/gunsmiths/${claim.gunsmith?.slug}`} className="mt-2 inline-block text-sm text-accent hover:text-accent-light">View gunsmith →</Link>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      {gRejectingId === claim.id ? (
                        <>
                          <input
                            type="text"
                            placeholder="Reject reason (optional)"
                            value={gRejectNote}
                            onChange={(e) => setGRejectNote(e.target.value)}
                            className="rounded border border-stone-600 bg-surface px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:border-accent focus:outline-none"
                          />
                          <button type="button" onClick={() => gRejectMutation.mutate({ id: claim.id, adminNote: gRejectNote })} disabled={gRejectMutation.isPending} className="rounded px-3 py-2 text-sm font-medium bg-red-600/80 text-white hover:bg-red-600 disabled:opacity-50">Confirm reject</button>
                          <button type="button" onClick={() => { setGRejectingId(null); setGRejectNote('') }} className="rounded px-3 py-2 text-sm font-medium text-stone-400 hover:text-stone-200">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => gApproveMutation.mutate(claim.id)} disabled={gApproveMutation.isPending} className="rounded px-3 py-2 text-sm font-medium bg-green-600/80 text-white hover:bg-green-600 disabled:opacity-50">Approve</button>
                          <button type="button" onClick={() => setGRejectingId(claim.id)} disabled={gRejectMutation.isPending} className="rounded px-3 py-2 text-sm font-medium border border-stone-600 text-stone-300 hover:bg-surface-muted hover:text-stone-100">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'Gunsmiths' && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-stone-200">All gunsmiths</h2>
          {gunsmiths.length === 0 ? (
            <p className="mt-2 text-stone-500">No gunsmiths.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {gunsmiths.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-2 border-b border-stone-800">
                  <div>
                    <Link to={`/gunsmiths/${g.slug}`} className="text-accent hover:text-accent-light font-medium">{g.shopName ?? g.name}</Link>
                    <span className="ml-2 text-sm text-stone-500">{g.city}, {g.state}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${g.status === 'ACTIVE' ? 'bg-green-900/50 text-green-400' : 'bg-stone-700 text-stone-400'}`}>{g.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'FFL' && (
        <section className="mt-8 space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-stone-200">FFL sync status</h2>
            <div className="mt-2 p-4 rounded-lg border border-stone-700 bg-surface-elevated">
              {lastSync ? (
                <p className="text-stone-400">
                  Last sync: {new Date(lastSync.syncedAt).toLocaleString()} — {lastSync.recordCount} records — {lastSync.success ? 'Success' : 'Failed'}
                  {lastSync.errorNote && <span className="text-red-400"> — {lastSync.errorNote}</span>}
                </p>
              ) : (
                <p className="text-stone-500">No sync yet. Trigger sync to download ATF FFL database.</p>
              )}
              <button
                type="button"
                onClick={() => fflSyncMutation.mutate()}
                disabled={fflSyncMutation.isPending}
                className="mt-3 px-4 py-2 rounded bg-accent text-white font-medium text-sm hover:bg-accent-light disabled:opacity-50"
              >
                {fflSyncMutation.isPending ? 'Syncing...' : 'Trigger sync'}
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-200">FFLs expiring (next 60 days)</h2>
            {fflExpiring.length === 0 ? (
              <p className="mt-2 text-stone-500">No FFLs expiring in the next 60 days.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {fflExpiring.map((g) => (
                  <li key={g.id} className="flex items-center justify-between py-2 border-b border-stone-800">
                    <Link to={`/gunsmiths/${g.slug}`} className="text-accent hover:text-accent-light">{g.shopName ?? g.name}</Link>
                    <span className="text-amber-400 text-sm">Expires {g.fflExpiry ? new Date(g.fflExpiry).toLocaleDateString() : '?'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
