import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useApi } from '../lib/useApi'

const FORM_LABELS = {
  FORM_1: 'Form 1',
  FORM_4: 'Form 4',
  EFORM_1: 'eForm 1',
  EFORM_4: 'eForm 4',
}

const ITEM_LABELS = {
  SUPPRESSOR: 'Suppressor',
  SBR: 'SBR',
  SBS: 'SBS',
  MG: 'Machine gun',
  AOW: 'AOW',
}

const STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DENIED: 'Denied',
}

const TRUST_LABELS = {
  TRUST: 'Trust',
  INDIVIDUAL: 'Individual',
}

const CHART_COLORS = ['#c8622a', '#8b5a2b', '#6b4423', '#4a2f1a']

export default function NFATracker() {
  const { api, isSignedIn } = useApi()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    formType: 'EFORM_4',
    itemType: 'SUPPRESSOR',
    submittedDate: '',
    approvedDate: '',
    examinerName: '',
    status: 'PENDING',
    trustOrIndividual: 'TRUST',
    notes: '',
  })

  const { data: statsData } = useQuery({
    queryKey: ['nfa', 'stats'],
    queryFn: () => api.get('/nfa-submissions/stats'),
  })

  const { data: mineData } = useQuery({
    queryKey: ['nfa', 'mine'],
    queryFn: () => api.get('/nfa-submissions'),
    enabled: isSignedIn,
  })

  const submitMutation = useMutation({
    mutationFn: (body) => api.post('/nfa-submissions', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfa', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['nfa', 'mine'] })
      setForm((f) => ({ ...f, submittedDate: '', approvedDate: '', examinerName: '', notes: '' }))
    },
  })

  const stats = statsData?.data
  const byFormType = stats?.byFormType ?? []
  const mySubmissions = mineData?.data ?? []

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.submittedDate) return
    submitMutation.mutate({
      formType: form.formType,
      itemType: form.itemType,
      submittedDate: new Date(form.submittedDate).toISOString(),
      approvedDate: form.approvedDate ? new Date(form.approvedDate).toISOString() : null,
      examinerName: form.examinerName || null,
      status: form.status,
      trustOrIndividual: form.trustOrIndividual,
      notes: form.notes || null,
    })
  }

  const chartData = byFormType.map((r) => ({
    name: FORM_LABELS[r.formType] ?? r.formType,
    days: r.avgWaitDays,
    count: r.count,
  }))

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-stone-100">NFA Wait Tracker</h1>
      <p className="mt-1 text-stone-500">
        Crowdsourced Form 4 and eForm 4 wait times. Log your submission to help others.
      </p>

      <section className="mt-8 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
        <h2 className="text-lg font-semibold text-stone-100 mb-4">Average wait time by form type</h2>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#78716c" tick={{ fill: '#a8a29e' }} />
                <YAxis stroke="#78716c" tick={{ fill: '#a8a29e' }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#a8a29e' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403c', borderRadius: '6px' }}
                  labelStyle={{ color: '#e7e5e4' }}
                  formatter={(value, name, props) => [`${value} days (${props.payload.count} submissions)`, 'Avg wait']}
                />
                <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-stone-500 py-8 text-center">No approved submissions yet. Log yours below to seed the data.</p>
        )}
        {stats && (
          <p className="mt-2 text-sm text-stone-500">
            {stats.totalSubmissions} total submission{stats.totalSubmissions !== 1 ? 's' : ''}
            {stats.pendingSubmissions > 0 && ` · ${stats.pendingSubmissions} pending`}
          </p>
        )}
      </section>

      {isSignedIn ? (
        <>
          <section className="mt-8 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
            <h2 className="text-lg font-semibold text-stone-100 mb-4">Log my submission</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Form type</label>
                  <select
                    value={form.formType}
                    onChange={(e) => setForm((f) => ({ ...f, formType: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                  >
                    {Object.entries(FORM_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Item type</label>
                  <select
                    value={form.itemType}
                    onChange={(e) => setForm((f) => ({ ...f, itemType: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                  >
                    {Object.entries(ITEM_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Submitted date *</label>
                  <input
                    type="date"
                    required
                    value={form.submittedDate}
                    onChange={(e) => setForm((f) => ({ ...f, submittedDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Approved date (if approved)</label>
                  <input
                    type="date"
                    value={form.approvedDate}
                    onChange={(e) => setForm((f) => ({ ...f, approvedDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Trust or individual</label>
                  <select
                    value={form.trustOrIndividual}
                    onChange={(e) => setForm((f) => ({ ...f, trustOrIndividual: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                  >
                    {Object.entries(TRUST_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Examiner name (optional)</label>
                <input
                  type="text"
                  value={form.examinerName}
                  onChange={(e) => setForm((f) => ({ ...f, examinerName: e.target.value }))}
                  placeholder="e.g. J. Smith"
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Batch approval, expedited"
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              <button
                type="submit"
                disabled={submitMutation.isPending || !form.submittedDate}
                className="px-4 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light disabled:opacity-50"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Log submission'}
              </button>
              {submitMutation.isError && (
                <p className="text-red-400 text-sm mt-2">{submitMutation.error.message}</p>
              )}
            </form>
          </section>

          {mySubmissions.length > 0 && (
            <section className="mt-8 p-6 rounded-lg border border-stone-700 bg-surface-elevated">
              <h2 className="text-lg font-semibold text-stone-100 mb-4">My submissions</h2>
              <ul className="space-y-3">
                {mySubmissions.map((s) => {
                  const submitted = new Date(s.submittedDate).toLocaleDateString()
                  const approved = s.approvedDate ? new Date(s.approvedDate).toLocaleDateString() : '—'
                  const days = s.approvedDate
                    ? Math.round((new Date(s.approvedDate) - new Date(s.submittedDate)) / (24 * 60 * 60 * 1000))
                    : null
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center gap-4 py-3 border-b border-stone-700 last:border-0"
                    >
                      <span className="font-medium text-stone-200">
                        {FORM_LABELS[s.formType]} · {ITEM_LABELS[s.itemType]}
                      </span>
                      <span className="text-stone-500 text-sm">Submitted {submitted}</span>
                      <span className="text-stone-500 text-sm">Approved {approved}</span>
                      {days != null && (
                        <span className="text-accent text-sm">{days} days</span>
                      )}
                      <span className={`text-sm px-2 py-0.5 rounded ${s.status === 'APPROVED' ? 'bg-green-900/40 text-green-300' : s.status === 'DENIED' ? 'bg-red-900/40 text-red-300' : 'bg-stone-700 text-stone-400'}`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="mt-8 p-6 rounded-lg border border-stone-700 bg-surface-elevated text-center">
          <p className="text-stone-400">Sign in to log your NFA submission and help build the wait time data.</p>
        </div>
      )}
    </div>
  )
}
