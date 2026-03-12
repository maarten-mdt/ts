import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/useApi'
import {
  FOCUS_LABELS,
  FFL_LICENSE_OPTIONS,
  ALL_SPECIALTIES_BY_CATEGORY,
  SPECIALTY_LABELS,
} from '../lib/gunsmithTaxonomy'

const CATEGORY_LABELS = {
  rifle: 'Rifle specialties',
  handgun: 'Handgun specialties',
  shotgun: 'Shotgun specialties',
  nfa: 'NFA / Class III',
  general: 'General / other',
}

function splitLines(s) {
  if (!s || typeof s !== 'string') return []
  return s
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function joinLines(arr) {
  return Array.isArray(arr) ? arr.join('\n') : ''
}

export default function GunsmithEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { api, isSignedIn } = useApi()

  const [form, setForm] = useState({
    name: '',
    shopName: '',
    bio: '',
    yearsExperience: '',
    credentials: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    lat: '',
    lng: '',
    acceptsMailIn: false,
    mailInOnly: false,
    serviceRadiusMiles: '',
    primaryFocus: 'GENERAL',
    specialties: [],
    platformsServiced: '',
    calibersServiced: '',
    avgTurnaroundWeeks: '',
    turnaroundNotes: '',
    rushJobsAvailable: false,
    showsPricing: false,
    laborRatePerHour: '',
    pricingNotes: '',
    hasFfl: false,
    fflNumber: '',
    fflLicenseType: '',
    fflAutoDownload: false,
    website: '',
    phone: '',
    email: '',
    bookingUrl: '',
    insuranceCarried: false,
    photos: '',
    heroPhoto: '',
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['gunsmith', 'by-id', id],
    queryFn: () => api.get(`/gunsmiths/by-id/${id}`),
    enabled: !!id && isSignedIn,
  })

  useEffect(() => {
    if (!data?.data) return
    const g = data.data
    setForm({
      name: g.name ?? '',
      shopName: g.shopName ?? '',
      bio: g.bio ?? '',
      yearsExperience: g.yearsExperience ?? '',
      credentials: joinLines(g.credentials),
      address: g.address ?? '',
      city: g.city ?? '',
      state: g.state ?? '',
      zip: g.zip ?? '',
      country: g.country ?? 'US',
      lat: g.lat ?? '',
      lng: g.lng ?? '',
      acceptsMailIn: !!g.acceptsMailIn,
      mailInOnly: !!g.mailInOnly,
      serviceRadiusMiles: g.serviceRadiusMiles ?? '',
      primaryFocus: g.primaryFocus ?? 'GENERAL',
      specialties: Array.isArray(g.specialties) ? [...g.specialties] : [],
      platformsServiced: joinLines(g.platformsServiced),
      calibersServiced: joinLines(g.calibersServiced),
      avgTurnaroundWeeks: g.avgTurnaroundWeeks ?? '',
      turnaroundNotes: g.turnaroundNotes ?? '',
      rushJobsAvailable: !!g.rushJobsAvailable,
      showsPricing: !!g.showsPricing,
      laborRatePerHour: g.laborRatePerHour ?? '',
      pricingNotes: g.pricingNotes ?? '',
      hasFfl: !!g.hasFfl,
      fflNumber: g.fflNumber ?? '',
      fflLicenseType: g.fflLicenseType ?? '',
      fflAutoDownload: !!g.fflAutoDownload,
      website: g.website ?? '',
      phone: g.phone ?? '',
      email: g.email ?? '',
      bookingUrl: g.bookingUrl ?? '',
      insuranceCarried: !!g.insuranceCarried,
      photos: joinLines(g.photos),
      heroPhoto: g.heroPhoto ?? '',
    })
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (payload) => api.patch(`/gunsmiths/${id}`, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['gunsmith', 'by-id', id] })
      queryClient.invalidateQueries({ queryKey: ['gunsmiths', 'mine'] })
      if (res?.data?.slug) {
        navigate(`/gunsmiths/${res.data.slug}`, { replace: true })
      } else {
        navigate('/dashboard/gunsmiths', { replace: true })
      }
    },
  })

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSpecialty(code) {
    setForm((prev) => {
      const next = prev.specialties.includes(code)
        ? prev.specialties.filter((s) => s !== code)
        : [...prev.specialties, code]
      return { ...prev, specialties: next }
    })
  }

  function buildPayload() {
    const specialties = form.specialties
    const platformsServiced = splitLines(form.platformsServiced)
    const calibersServiced = splitLines(form.calibersServiced)
    const credentials = splitLines(form.credentials)
    const photos = splitLines(form.photos)

    return {
      name: form.name || undefined,
      shopName: form.shopName || undefined,
      bio: form.bio || undefined,
      yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
      credentials,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      zip: form.zip || undefined,
      country: form.country || undefined,
      lat: form.lat ? Number(form.lat) : undefined,
      lng: form.lng ? Number(form.lng) : undefined,
      acceptsMailIn: form.acceptsMailIn,
      mailInOnly: form.mailInOnly,
      serviceRadiusMiles: form.serviceRadiusMiles ? Number(form.serviceRadiusMiles) : null,
      primaryFocus: form.primaryFocus,
      specialties,
      platformsServiced,
      calibersServiced,
      avgTurnaroundWeeks: form.avgTurnaroundWeeks ? Number(form.avgTurnaroundWeeks) : null,
      turnaroundNotes: form.turnaroundNotes || undefined,
      rushJobsAvailable: form.rushJobsAvailable,
      showsPricing: form.showsPricing,
      laborRatePerHour: form.laborRatePerHour ? Number(form.laborRatePerHour) : null,
      pricingNotes: form.pricingNotes || undefined,
      hasFfl: form.hasFfl,
      fflNumber: form.hasFfl && form.fflNumber ? form.fflNumber : undefined,
      fflLicenseType: form.fflLicenseType || undefined,
      fflAutoDownload: form.fflAutoDownload,
      website: form.website || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      bookingUrl: form.bookingUrl || undefined,
      insuranceCarried: form.insuranceCarried,
      photos,
      heroPhoto: form.heroPhoto || null,
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    saveMutation.mutate(buildPayload())
  }

  const g = data?.data
  const isUS = form.country === 'US'

  if (!isSignedIn) {
    return (
      <div>
        <p className="text-stone-400">Sign in to edit this listing.</p>
      </div>
    )
  }

  if (isLoading || !g) {
    return (
      <div>
        <Link to="/dashboard/gunsmiths" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">← Dashboard</Link>
        <p className="text-stone-500">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Link to="/dashboard/gunsmiths" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">← Dashboard</Link>
        <p className="text-red-400">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link to="/dashboard/gunsmiths" className="text-sm text-stone-500 hover:text-stone-300 mb-4 inline-block">← Dashboard</Link>
      <h1 className="text-2xl font-bold text-stone-100 mb-2">Edit listing</h1>
      <p className="text-stone-500 mb-6">{g.shopName ?? g.name}</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Basic info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Gunsmith name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Shop / business name</label>
              <input
                type="text"
                value={form.shopName}
                onChange={(e) => update('shopName', e.target.value)}
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Bio / description</label>
              <textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Years experience</label>
                <input
                  type="number"
                  min={0}
                  value={form.yearsExperience}
                  onChange={(e) => update('yearsExperience', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Credentials (one per line)</label>
              <textarea
                value={form.credentials}
                onChange={(e) => update('credentials', e.target.value)}
                rows={2}
                placeholder="e.g. Armorer Certified, Brownells Trained"
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>
        </section>

        {/* Location & Service Area */}
        <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Location & service area</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">State / Prov</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => update('state', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">ZIP</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => update('zip', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                >
                  <option value="US">US</option>
                  <option value="CA">CA</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => update('lat', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => update('lng', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.acceptsMailIn}
                  onChange={(e) => update('acceptsMailIn', e.target.checked)}
                  className="rounded border-stone-600 bg-surface text-accent focus:ring-accent"
                />
                <span className="text-stone-300">Accepts mail-in</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.mailInOnly}
                  onChange={(e) => update('mailInOnly', e.target.checked)}
                  className="rounded border-stone-600 bg-surface text-accent focus:ring-accent"
                />
                <span className="text-stone-300">Mail-in only (no walk-in)</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Service radius (miles, walk-in)</label>
              <input
                type="number"
                min={0}
                value={form.serviceRadiusMiles}
                onChange={(e) => update('serviceRadiusMiles', e.target.value)}
                placeholder="Optional"
                className="w-32 px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>
        </section>

        {/* Primary focus */}
        <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Primary focus</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(FOCUS_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="primaryFocus"
                  value={value}
                  checked={form.primaryFocus === value}
                  onChange={(e) => update('primaryFocus', e.target.value)}
                  className="border-stone-600 bg-surface text-accent focus:ring-accent"
                />
                <span className="text-stone-300">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Specialties */}
        <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Specialties</h2>
          <p className="text-sm text-stone-500 mb-4">Select all that apply. Grouped by category.</p>
          <div className="space-y-6">
            {Object.entries(ALL_SPECIALTIES_BY_CATEGORY).map(([cat, codes]) => (
              <div key={cat}>
                <h3 className="text-sm font-medium text-stone-400 mb-2">{CATEGORY_LABELS[cat] ?? cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {codes.map((code) => (
                    <label
                      key={code}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-stone-600 bg-surface cursor-pointer hover:border-stone-500"
                    >
                      <input
                        type="checkbox"
                        checked={form.specialties.includes(code)}
                        onChange={() => toggleSpecialty(code)}
                        className="rounded border-stone-600 bg-surface text-accent focus:ring-accent"
                      />
                      <span className="text-sm text-stone-300">{SPECIALTY_LABELS[code] ?? code}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Platforms & Calibers */}
        <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Platforms & calibers</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Platforms serviced (one per line)</label>
              <textarea
                value={form.platformsServiced}
                onChange={(e) => update('platformsServiced', e.target.value)}
                rows={3}
                placeholder="e.g. AR-15, Remington 700, Glock (one per line)"
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Calibers serviced (one per line, optional)</label>
              <textarea
                value={form.calibersServiced}
                onChange={(e) => update('calibersServiced', e.target.value)}
                rows={2}
                placeholder="e.g. 6.5 Creedmoor, 338 Lapua (one per line)"
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>
        </section>

        {/* Turnaround & Pricing */}
        <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Turnaround & pricing</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Avg turnaround (weeks)</label>
                <input
                  type="number"
                  min={0}
                  value={form.avgTurnaroundWeeks}
                  onChange={(e) => update('avgTurnaroundWeeks', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Turnaround notes</label>
              <textarea
                value={form.turnaroundNotes}
                onChange={(e) => update('turnaroundNotes', e.target.value)}
                rows={2}
                placeholder="e.g. Currently 8–10 weeks on barrel work"
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.rushJobsAvailable}
                  onChange={(e) => update('rushJobsAvailable', e.target.checked)}
                  className="rounded border-stone-600 bg-surface text-accent focus:ring-accent"
                />
                <span className="text-stone-300">Rush jobs available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showsPricing}
                  onChange={(e) => update('showsPricing', e.target.checked)}
                  className="rounded border-stone-600 bg-surface text-accent focus:ring-accent"
                />
                <span className="text-stone-300">Show pricing</span>
              </label>
            </div>
            {form.showsPricing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Labor rate ($/hr)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.laborRatePerHour}
                    onChange={(e) => update('laborRatePerHour', e.target.value)}
                    className="w-32 px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Pricing notes</label>
                  <input
                    type="text"
                    value={form.pricingNotes}
                    onChange={(e) => update('pricingNotes', e.target.value)}
                    placeholder="e.g. Free estimates, call first"
                    className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* FFL (US only) */}
        {isUS && (
          <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
            <h2 className="text-lg font-semibold text-stone-100 mb-4">FFL information</h2>
            {g.fflVerified != null && (
              <p className="text-sm text-stone-400 mb-4">
                Status: {g.fflVerified ? 'Verified' : 'Unverified'}
                {g.fflExpiry && ` · Expires: ${new Date(g.fflExpiry).toLocaleDateString()}`}
              </p>
            )}
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasFfl}
                  onChange={(e) => update('hasFfl', e.target.checked)}
                  className="rounded border-stone-600 bg-surface text-accent focus:ring-accent"
                />
                <span className="text-stone-300">Has FFL license</span>
              </label>
              {form.hasFfl && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">FFL number</label>
                    <input
                      type="text"
                      value={form.fflNumber}
                      onChange={(e) => update('fflNumber', e.target.value)}
                      placeholder="X-XX-XXX-XX-XX-XXXXX"
                      className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-400 mb-1">License type</label>
                    <select
                      value={form.fflLicenseType}
                      onChange={(e) => update('fflLicenseType', e.target.value)}
                      className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                    >
                      <option value="">— Select —</option>
                      {FFL_LICENSE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.fflAutoDownload}
                      onChange={(e) => update('fflAutoDownload', e.target.checked)}
                      className="rounded border-stone-600 bg-surface text-accent focus:ring-accent"
                    />
                    <span className="text-stone-300">Allow public FFL document download</span>
                  </label>
                </>
              )}
            </div>
            <p className="mt-3 text-sm text-stone-500">Upload or replace your FFL document (PDF) from your listing page after saving.</p>
          </section>
        )}

        {/* Contact & Booking */}
        <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Contact & booking</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 focus:ring-1 focus:ring-accent focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Booking URL</label>
              <input
                type="url"
                value={form.bookingUrl}
                onChange={(e) => update('bookingUrl', e.target.value)}
                placeholder="Link to online booking"
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.insuranceCarried}
                onChange={(e) => update('insuranceCarried', e.target.checked)}
                className="rounded border-stone-600 bg-surface text-accent focus:ring-accent"
              />
              <span className="text-stone-300">Insurance carried</span>
            </label>
          </div>
        </section>

        {/* Photos */}
        <section className="p-5 rounded-lg border border-stone-700 bg-surface-elevated">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">Photos</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Photo URLs (one per line)</label>
              <textarea
                value={form.photos}
                onChange={(e) => update('photos', e.target.value)}
                rows={4}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-1">Hero photo URL</label>
              <input
                type="url"
                value={form.heroPhoto}
                onChange={(e) => update('heroPhoto', e.target.value)}
                placeholder="Primary image for listing"
                className="w-full px-3 py-2 rounded bg-surface border border-stone-600 text-stone-100 placeholder-stone-500 focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 rounded bg-accent text-white font-medium hover:bg-accent-light disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
          <Link
            to={`/gunsmiths/${g.slug}`}
            className="px-5 py-2.5 rounded border border-stone-600 text-stone-300 font-medium hover:bg-surface-muted"
          >
            Cancel
          </Link>
        </div>
        {saveMutation.isError && (
          <p className="text-red-400 text-sm">{saveMutation.error.message}</p>
        )}
      </form>
    </div>
  )
}
