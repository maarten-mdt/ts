import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { auth, optionalAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'

export const rangesRouter = Router()

const RANGE_TYPE = ['PUBLIC', 'PRIVATE', 'CLUB', 'COMMERCIAL', 'MILITARY']
const SORT_OPTIONS = ['distance', 'rating', 'newest', 'name']

const searchSchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusMiles: z.coerce.number().optional(),
  state: z.string().optional(),
  minDistance: z.coerce.number().optional(),
  maxDistance: z.coerce.number().optional(),
  rangeType: z.enum(RANGE_TYPE).optional(),
  rangeTypes: z.string().optional(), // comma-separated for multiple
  steelAllowed: z.coerce.boolean().optional(),
  proneAllowed: z.coerce.boolean().optional(),
  covered: z.coerce.boolean().optional(),
  membershipRequired: z.coerce.boolean().optional(),
  hostsMatches: z.coerce.boolean().optional(),
  matchType: z.string().optional(),
  suppressorFriendly: z.coerce.boolean().optional(),
  dayFeeAvailable: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(SORT_OPTIONS).default('newest'),
})

// GET /api/ranges — Public search
rangesRouter.get('/', async (req, res) => {
  try {
    const params = searchSchema.safeParse(req.query)
    if (!params.success) {
      return res.status(400).json({ success: false, error: params.error.flatten() })
    }
    const q = params.data

    const where = {
      status: 'ACTIVE',
    }

    if (q.state) where.state = { contains: q.state, mode: 'insensitive' }
    if (q.minDistance != null || q.maxDistance != null) {
      where.maxDistanceYards = {}
      if (q.minDistance != null) where.maxDistanceYards.gte = q.minDistance
      if (q.maxDistance != null) where.maxDistanceYards.lte = q.maxDistance
    }
    if (q.rangeTypes) {
      const types = q.rangeTypes.split(',').map((t) => t.trim()).filter(Boolean)
      if (types.length) where.rangeType = { in: types }
    } else if (q.rangeType) where.rangeType = q.rangeType
    if (q.steelAllowed === true) where.steelTargetsAllowed = true
    if (q.proneAllowed === true) where.proneAllowed = true
    if (q.covered === true) where.coveredPositions = true
    if (q.membershipRequired === true) where.membershipRequired = true
    if (q.hostsMatches === true) where.hostsMatches = true
    if (q.matchType) where.matchTypes = { has: q.matchType }
    if (q.suppressorFriendly === true) where.suppressorFriendly = true
    if (q.dayFeeAvailable === true) where.dayFeeAvailable = true
    if (q.verified === true) where.verified = true
    if (q.featured === true) where.featured = true

    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { city: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const orderBy =
      q.sort === 'name'
        ? { name: 'asc' }
        : q.sort === 'rating'
          ? { googleRating: 'desc' }
          : q.sort === 'newest'
            ? { createdAt: 'desc' }
            : { name: 'asc' }

    const [ranges, total] = await Promise.all([
      prisma.range.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          state: true,
          maxDistanceYards: true,
          rangeType: true,
          steelTargetsAllowed: true,
          proneAllowed: true,
          coveredPositions: true,
          membershipRequired: true,
          dayFeeAvailable: true,
          dayFeeAmount: true,
          googleRating: true,
          googleReviewCount: true,
          verified: true,
          claimed: true,
          hostsMatches: true,
          matchTypes: true,
          lat: true,
          lng: true,
        },
        orderBy,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.range.count({ where }),
    ])

    // TODO: filter by radius + sort by distance when lat/lng provided
    res.json({
      success: true,
      data: ranges,
      meta: { total, page: q.page, limit: q.limit },
    })
  } catch (err) {
    console.error('[GET /api/ranges]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/ranges/:slug — Public single range
rangesRouter.get('/:slug', async (req, res) => {
  try {
    const range = await prisma.range.findUnique({
      where: { slug: req.params.slug, status: 'ACTIVE' },
      include: {
        _count: { select: { reviews: true } },
      },
    })
    if (!range) {
      return res.status(404).json({ success: false, error: 'Range not found' })
    }

    const { adminNotes, ...rangePublic } = range

    const avgReview = await prisma.review.aggregate({
      where: { rangeId: range.id },
      _avg: { rating: true },
      _count: true,
    })

    res.json({
      success: true,
      data: {
        ...rangePublic,
        ourRating: avgReview._avg.rating,
        ourReviewCount: avgReview._count,
      },
    })
  } catch (err) {
    console.error('[GET /api/ranges/:slug]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
