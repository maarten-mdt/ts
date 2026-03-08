import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SignInButton } from '@clerk/clerk-react'

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
import { useApi } from '../lib/useApi'

const VERIFICATION_OPTIONS = [
  "I manage the range's website/email",
  'I can receive a call at the range',
  'Other',
]

export default function RangeClaimForm() {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const { api, isSignedIn } = useApi()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    claimantName: '',
    claimantTitle: '',
    claimantPhone: '',
    claimantEmail: '',
    verificationNote: '',
    note: '',
  })

  const { data: rangeData } = useQuery({
    queryKey: ['range', slug],
    queryFn: () => api.get(`/ranges/${slug}`),
  })
  const range = rangeData?.data

  if (!range) {
    return (
      <div>
        <Link to="/ranges" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
          ← Back to ranges
        </Link>
        <p className="text-stone-500">Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div>
        <Link to={`/ranges/${slug}`} className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
          ← Back to range
        </Link>
        <h1 className="text-2xl font-bold text-stone-100">Claim: {range.name}</h1>
        <p className="mt-2 text-stone-400 mb-4">
          Sign in to submit a claim for this listing.
        </p>
        {hasClerk ? (
          <SignInButton mode="modal">
            <button type="button" className="px-4 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light">
              Sign in
            </button>
          </SignInButton>
        ) : (
          <p className="text-stone-500">Sign in is not configured.</p>
        )}
      </div>
    )
  }

  const mutation = useMutation({
    mutationFn: (body) => api.post('/claims', { ...body, rangeId: range?.id }),
    onSuccess: () => {
      setSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ['range', slug] })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      ...form,
      verificationNote: form.verificationNote || form.note,
    })
  }

  if (range.claimed) {
    return (
      <div>
        <Link to={`/ranges/${slug}`} className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
          ← Back to range
        </Link>
        <p className="text-stone-400">This range has already been claimed.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-lg">
        <Link to={`/ranges/${slug}`} className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
          ← Back to range
        </Link>
        <div className="p-6 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-xl font-semibold text-stone-100">Claim submitted</h2>
          <p className="mt-2 text-stone-400">
            Your claim for {range.name} has been received. We&apos;ll review it and get back to you shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to={`/ranges/${slug}`} className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">
        ← Back to range
      </Link>
      <h1 className="text-2xl font-bold text-stone-100">Claim: {range.name}</h1>
      <p className="mt-2 text-stone-500 mb-6">
        Submit this form to claim ownership of this listing. You must be able to verify your affiliation.
      </p>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-400 mb-1">Full name</label>
          <input
            type="text"
            required
            value={form.claimantName}
            onChange={(e) => setForm((f) => ({ ...f, claimantName: e.target.value }))}
            className="w-full px-4 py-2 rounded border border-stone-700 bg-surface text-stone-100 outline-none focus:border-stone-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-400 mb-1">Title / role</label>
          <input
            type="text"
            required
            placeholder="e.g. Range Manager, Club President"
            value={form.claimantTitle}
            onChange={(e) => setForm((f) => ({ ...f, claimantTitle: e.target.value }))}
            className="w-full px-4 py-2 rounded border border-stone-700 bg-surface text-stone-100 placeholder-stone-500 outline-none focus:border-stone-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-400 mb-1">Phone</label>
          <input
            type="tel"
            required
            value={form.claimantPhone}
            onChange={(e) => setForm((f) => ({ ...f, claimantPhone: e.target.value }))}
            className="w-full px-4 py-2 rounded border border-stone-700 bg-surface text-stone-100 outline-none focus:border-stone-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-400 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.claimantEmail}
            onChange={(e) => setForm((f) => ({ ...f, claimantEmail: e.target.value }))}
            className="w-full px-4 py-2 rounded border border-stone-700 bg-surface text-stone-100 outline-none focus:border-stone-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-400 mb-1">
            How will you verify ownership?
          </label>
          <select
            value={form.verificationNote}
            onChange={(e) => setForm((f) => ({ ...f, verificationNote: e.target.value }))}
            className="w-full px-4 py-2 rounded border border-stone-700 bg-surface text-stone-100 outline-none focus:border-stone-600"
          >
            <option value="">Select...</option>
            {VERIFICATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-400 mb-1">Additional note (optional)</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 rounded border border-stone-700 bg-surface text-stone-100 placeholder-stone-500 outline-none focus:border-stone-600"
          />
        </div>
        {mutation.isError && (
          <p className="text-red-400">{(mutation.error).message}</p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-2 rounded bg-accent text-white font-medium hover:bg-accent-light disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit claim'}
        </button>
      </form>
    </div>
  )
}
