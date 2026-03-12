import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { auth, optionalAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'
import { verifyFflNumber, normalizeFflNumber } from '../services/fflVerification.js'

export const gunsmithsRouter = Router()

const FOCUS_OPTIONS = ['RIFLE', 'HANDGUN', 'GENERAL', 'SHOTGUN', 'NFA']
const SORT_OPTIONS = ['distance', 'rating', 'turnaround', 'newest', 'name']

const searchSchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusMiles: z.coerce.number().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  primaryFocus: z.enum(FOCUS_OPTIONS).optional(),
  specialties: z.string().optional(),
  platformsServiced: z.string().optional(),
  acceptsMailIn: z.coerce.boolean().optional(),
  mailInOnly: z.coerce.boolean().optional(),
  hasFfl: z.coerce.boolean().optional(),
  fflVerified: z.coerce.boolean().optional(),
  fflLicenseType: z.string().optional(),
  maxTurnaroundWeeks: z.coerce.number().optional(),
  rushJobsAvailable: z.coerce.boolean().optional(),
  minRating: z.coerce.number().optional(),
  verified: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(SORT_OPTIONS).default('newest'),
})

function canEditGunsmith(req, gunsmith) {
  if (!req.user) return false
  if (req.user.role === 'ADMIN') return true
  return gunsmith.ownerId === req.user.id
}

// GET /api/gunsmiths — Public search
gunsmithsRouter.get('/', async (req, res) => {
  try {
    const params = searchSchema.safeParse(req.query)
    if (!params.success) {
      return res.status(400).json({ success: false, error: params.error.flatten() })
    }
    const q = params.data

    const where = { status: 'ACTIVE' }

    if (q.state) where.state = { contains: q.state, mode: 'insensitive' }
    if (q.city) where.city = { contains: q.city, mode: 'insensitive' }
    if (q.primaryFocus) where.primaryFocus = q.primaryFocus
    if (q.acceptsMailIn === true) where.acceptsMailIn = true
    if (q.mailInOnly === true) where.mailInOnly = true
    if (q.hasFfl === true) where.hasFfl = true
    if (q.fflVerified === true) where.fflVerified = true
    if (q.fflLicenseType) where.fflLicenseType = q.fflLicenseType
    if (q.maxTurnaroundWeeks != null) {
      where.avgTurnaroundWeeks = { lte: q.maxTurnaroundWeeks }
    }
    if (q.rushJobsAvailable === true) where.rushJobsAvailable = true
    if (q.verified === true) where.verified = true
    if (q.featured === true) where.featured = true
    if (q.specialties) {
      const specs = q.specialties.split(',').map((s) => s.trim()).filter(Boolean)
      if (specs.length) where.specialties = { hasSome: specs }
    }
    if (q.platformsServiced) {
      const platforms = q.platformsServiced.split(',').map((s) => s.trim()).filter(Boolean)
      if (platforms.length) where.platformsServiced = { hasSome: platforms }
    }
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { shopName: { contains: q.search, mode: 'insensitive' } },
        { bio: { contains: q.search, mode: 'insensitive' } },
        { city: { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const orderBy =
      q.sort === 'name'
        ? { name: 'asc' }
        : q.sort === 'rating'
          ? { googleRating: 'desc' }
          : q.sort === 'turnaround'
            ? { avgTurnaroundWeeks: 'asc' }
            : q.sort === 'newest'
              ? { createdAt: 'desc' }
              : { name: 'asc' }

    const [gunsmiths, total] = await Promise.all([
      prisma.gunsmith.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          shopName: true,
          city: true,
          state: true,
          country: true,
          primaryFocus: true,
          specialties: true,
          platformsServiced: true,
          acceptsMailIn: true,
          hasFfl: true,
          fflVerified: true,
          fflLicenseType: true,
          avgTurnaroundWeeks: true,
          googleRating: true,
          googleReviewCount: true,
          verified: true,
          claimed: true,
          lat: true,
          lng: true,
        },
        orderBy,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.gunsmith.count({ where }),
    ])

    res.json({
      success: true,
      data: gunsmiths,
      meta: { total, page: q.page, limit: q.limit },
    })
  } catch (err) {
    console.error('[GET /api/gunsmiths]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gunsmiths/mine — Auth: list current user's claimed gunsmiths
gunsmithsRouter.get('/mine', auth, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { ownerId: req.user.id }
    const gunsmiths = await prisma.gunsmith.findMany({
      where,
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { name: 'asc' },
    })
    const withRating = await Promise.all(
      gunsmiths.map(async (g) => {
        const agg = await prisma.review.aggregate({
          where: { gunsmithId: g.id },
          _avg: { rating: true },
        })
        return { ...g, ourRating: agg._avg.rating, ourReviewCount: g._count.reviews }
      })
    )
    res.json({ success: true, data: withRating })
  } catch (err) {
    console.error('[GET /api/gunsmiths/mine]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gunsmiths/by-id/:id — Auth: full gunsmith for edit (owner or ADMIN)
gunsmithsRouter.get('/by-id/:id', auth, requireRole('GUNSMITH', 'ADMIN'), async (req, res) => {
  try {
    const gunsmith = await prisma.gunsmith.findUnique({ where: { id: req.params.id } })
    if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    if (!canEditGunsmith(req, gunsmith)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    res.json({ success: true, data: gunsmith })
  } catch (err) {
    console.error('[GET /api/gunsmiths/by-id/:id]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/gunsmiths/:id/ffl-request — Auth: request FFL (sends notification to gunsmith)
gunsmithsRouter.post('/:id/ffl-request', auth, requireRole('USER', 'RANGE_OWNER', 'GUNSMITH', 'ADMIN'), async (req, res) => {
  try {
    const gunsmith = await prisma.gunsmith.findUnique({ where: { id: req.params.id } })
    if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    if (!gunsmith.fflFileUrl) return res.status(400).json({ success: false, error: 'No FFL document available' })
    if (gunsmith.fflAutoDownload) return res.status(400).json({ success: false, error: 'FFL is publicly available for download' })

    try {
      const { sendFflRequestNotification } = await import('../services/email.js')
      await sendFflRequestNotification(gunsmith, req.user)
    } catch (e) {
      console.warn('[ffl-request] Email failed:', e.message)
    }
    res.json({ success: true, message: 'Request sent. The gunsmith will be notified.' })
  } catch (err) {
    console.error('[POST /api/gunsmiths/:id/ffl-request]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gunsmiths/:id/ffl-download — Public (if autoDownload) or Auth
gunsmithsRouter.get('/:id/ffl-download', optionalAuth, async (req, res) => {
  try {
    const gunsmith = await prisma.gunsmith.findUnique({ where: { id: req.params.id } })
    if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    if (!gunsmith.fflFileUrl) return res.status(404).json({ success: false, error: 'No FFL document available' })

    const canDownload = gunsmith.fflAutoDownload || (req.user && (req.user.role === 'ADMIN' || gunsmith.ownerId === req.user.id))
    if (!canDownload) {
      return res.status(403).json({ success: false, error: 'FFL download requires login or gunsmith must enable public download' })
    }
    res.redirect(302, gunsmith.fflFileUrl)
  } catch (err) {
    console.error('[GET /api/gunsmiths/:id/ffl-download]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gunsmiths/:slug — Public single detail
gunsmithsRouter.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const gunsmith = await prisma.gunsmith.findUnique({
      where: { slug: req.params.slug, status: 'ACTIVE' },
      include: { _count: { select: { reviews: true } } },
    })
    if (!gunsmith) {
      return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    }

    const { adminNotes, ...gunsmithPublic } = gunsmith

    const avgReview = await prisma.review.aggregate({
      where: { gunsmithId: gunsmith.id },
      _avg: { rating: true },
      _count: true,
    })

    const showFullFfl = req.user && (req.user.role === 'ADMIN' || gunsmith.ownerId === req.user.id)
    const canEdit = req.user && (req.user.role === 'ADMIN' || gunsmith.ownerId === req.user.id)
    const maskFfl = (num) => {
      if (!num) return null
      if (showFullFfl) return num
      const parts = num.split('-')
      if (parts.length >= 6) return `${parts[0]}-${parts[1]}-${parts[2]}-**-**-*****`
      return num.replace(/\d(?=\d{4})/g, '*')
    }

    res.json({
      success: true,
      data: {
        ...gunsmithPublic,
        fflNumberDisplay: maskFfl(gunsmith.fflNumber),
        ourRating: avgReview._avg.rating,
        ourReviewCount: avgReview._count,
        canEdit: !!canEdit,
      },
    })
  } catch (err) {
    console.error('[GET /api/gunsmiths/:slug]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/gunsmiths — Auth: ADMIN or AGENT
gunsmithsRouter.post('/', auth, requireRole('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const body = req.body
    const slug = (body.slug ?? (body.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))).trim()
    if (!slug) return res.status(400).json({ success: false, error: 'slug or name required' })

    const data = {
      slug,
      name: body.name ?? 'Unnamed',
      shopName: body.shopName ?? null,
      status: body.status ?? 'PENDING',
      address: body.address ?? '',
      city: body.city ?? '',
      state: body.state ?? '',
      zip: body.zip ?? '',
      country: body.country ?? 'US',
      lat: Number(body.lat) ?? 0,
      lng: Number(body.lng) ?? 0,
      acceptsMailIn: !!body.acceptsMailIn,
      mailInOnly: !!body.mailInOnly,
      serviceRadiusMiles: body.serviceRadiusMiles ?? null,
      hasFfl: !!body.hasFfl,
      fflNumber: body.fflNumber ? normalizeFflNumber(body.fflNumber) : null,
      fflLicenseType: body.fflLicenseType ?? null,
      fflAutoDownload: !!body.fflAutoDownload,
      primaryFocus: body.primaryFocus ?? 'GENERAL',
      specialties: Array.isArray(body.specialties) ? body.specialties : [],
      platformsServiced: Array.isArray(body.platformsServiced) ? body.platformsServiced : [],
      calibersServiced: Array.isArray(body.calibersServiced) ? body.calibersServiced : [],
      avgTurnaroundWeeks: body.avgTurnaroundWeeks ?? null,
      turnaroundNotes: body.turnaroundNotes ?? null,
      rushJobsAvailable: !!body.rushJobsAvailable,
      showsPricing: !!body.showsPricing,
      laborRatePerHour: body.laborRatePerHour ?? null,
      pricingNotes: body.pricingNotes ?? null,
      credentials: Array.isArray(body.credentials) ? body.credentials : [],
      yearsExperience: body.yearsExperience ?? null,
      insuranceCarried: !!body.insuranceCarried,
      website: body.website ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      bookingUrl: body.bookingUrl ?? null,
      photos: Array.isArray(body.photos) ? body.photos : [],
      heroPhoto: body.heroPhoto ?? null,
      bio: body.bio ?? null,
    }

    const gunsmith = await prisma.gunsmith.create({ data: data })
    res.status(201).json({ success: true, data: gunsmith })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Slug already exists' })
    }
    console.error('[POST /api/gunsmiths]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/gunsmiths/:id — Auth: GUNSMITH (own) or ADMIN
gunsmithsRouter.put('/:id', auth, requireRole('GUNSMITH', 'ADMIN'), async (req, res) => {
  try {
    const gunsmith = await prisma.gunsmith.findUnique({ where: { id: req.params.id } })
    if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    if (!canEditGunsmith(req, gunsmith)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    const body = req.body
    const update = {}
    const allowed = [
      'name', 'shopName', 'address', 'city', 'state', 'zip', 'country', 'lat', 'lng',
      'acceptsMailIn', 'mailInOnly', 'serviceRadiusMiles', 'hasFfl', 'fflNumber', 'fflLicenseType',
      'fflAutoDownload', 'primaryFocus', 'specialties', 'platformsServiced', 'calibersServiced',
      'avgTurnaroundWeeks', 'turnaroundNotes', 'rushJobsAvailable', 'showsPricing',
      'laborRatePerHour', 'pricingNotes', 'credentials', 'yearsExperience', 'insuranceCarried',
      'website', 'phone', 'email', 'bookingUrl', 'photos', 'heroPhoto', 'bio', 'status',
    ]
    for (const k of allowed) {
      if (body[k] !== undefined) {
        if (k === 'fflNumber') update[k] = normalizeFflNumber(body[k]) ?? body[k]
        else if (k === 'specialties' || k === 'platformsServiced' || k === 'calibersServiced' || k === 'credentials' || k === 'photos')
          update[k] = Array.isArray(body[k]) ? body[k] : []
        else if (k === 'acceptsMailIn' || k === 'mailInOnly' || k === 'hasFfl' || k === 'fflAutoDownload' || k === 'rushJobsAvailable' || k === 'showsPricing' || k === 'insuranceCarried')
          update[k] = !!body[k]
        else update[k] = body[k]
      }
    }
    const updated = await prisma.gunsmith.update({
      where: { id: req.params.id },
      data: update,
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[PUT /api/gunsmiths/:id]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/gunsmiths/:id — Auth: GUNSMITH (own) or ADMIN
gunsmithsRouter.patch('/:id', auth, requireRole('GUNSMITH', 'ADMIN'), async (req, res) => {
  try {
    const gunsmith = await prisma.gunsmith.findUnique({ where: { id: req.params.id } })
    if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    if (!canEditGunsmith(req, gunsmith)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }

    const body = req.body
    const update = {}
    const allowed = [
      'name', 'shopName', 'address', 'city', 'state', 'zip', 'country', 'lat', 'lng',
      'acceptsMailIn', 'mailInOnly', 'serviceRadiusMiles', 'hasFfl', 'fflNumber', 'fflLicenseType',
      'fflAutoDownload', 'primaryFocus', 'specialties', 'platformsServiced', 'calibersServiced',
      'avgTurnaroundWeeks', 'turnaroundNotes', 'rushJobsAvailable', 'showsPricing',
      'laborRatePerHour', 'pricingNotes', 'credentials', 'yearsExperience', 'insuranceCarried',
      'website', 'phone', 'email', 'bookingUrl', 'photos', 'heroPhoto', 'bio', 'status',
    ]
    for (const k of allowed) {
      if (body[k] !== undefined) {
        if (k === 'fflNumber') update[k] = normalizeFflNumber(body[k]) ?? body[k]
        else if (k === 'specialties' || k === 'platformsServiced' || k === 'calibersServiced' || k === 'credentials' || k === 'photos')
          update[k] = Array.isArray(body[k]) ? body[k] : []
        else if (['acceptsMailIn', 'mailInOnly', 'hasFfl', 'fflAutoDownload', 'rushJobsAvailable', 'showsPricing', 'insuranceCarried'].includes(k))
          update[k] = !!body[k]
        else update[k] = body[k]
      }
    }
    const updated = await prisma.gunsmith.update({
      where: { id: req.params.id },
      data: update,
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[PATCH /api/gunsmiths/:id]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/gunsmiths/:id — Auth: ADMIN
gunsmithsRouter.delete('/:id', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.gunsmith.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    console.error('[DELETE /api/gunsmiths/:id]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/gunsmiths/:id/verify-ffl — Auth: ADMIN or AGENT
gunsmithsRouter.post('/:id/verify-ffl', auth, requireRole('ADMIN', 'AGENT'), async (req, res) => {
  try {
    const gunsmith = await prisma.gunsmith.findUnique({ where: { id: req.params.id } })
    if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    const fflNum = gunsmith.fflNumber
    if (!fflNum) return res.status(400).json({ success: false, error: 'No FFL number to verify' })

    const result = await verifyFflNumber(fflNum)
    const update = {
      fflVerified: result.valid,
      fflVerifiedAt: new Date(),
      fflExpiry: result.expiry ?? null,
      fflLicenseType: result.licenseType ?? gunsmith.fflLicenseType,
    }
    const updated = await prisma.gunsmith.update({
      where: { id: req.params.id },
      data: update,
    })
    res.json({ success: true, data: updated, verification: result })
  } catch (err) {
    console.error('[POST /api/gunsmiths/:id/verify-ffl]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

