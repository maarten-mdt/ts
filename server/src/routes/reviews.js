import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { auth, optionalAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'

export const reviewsRouter = Router()

const reviewSchema = z.object({
  rangeId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  body: z.string().min(10),
  visitDate: z.string().optional(),
})

// GET /api/reviews?rangeId=xxx — Public
reviewsRouter.get('/', async (req, res) => {
  try {
    const rangeId = req.query.rangeId
    if (!rangeId) {
      return res.status(400).json({ success: false, error: 'rangeId required' })
    }
    const reviews = await prisma.review.findMany({
      where: { rangeId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: reviews })
  } catch (err) {
    console.error('[GET /api/reviews]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/reviews — Submit review (auth required)
reviewsRouter.post('/', auth, requireRole('USER', 'RANGE_OWNER', 'GUNSMITH', 'ADMIN'), async (req, res) => {
  try {
    const body = reviewSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.flatten() })
    }
    const { rangeId, rating, body: reviewBody, visitDate } = body.data

    const range = await prisma.range.findUnique({ where: { id: rangeId } })
    if (!range) return res.status(404).json({ success: false, error: 'Range not found' })

    const review = await prisma.review.upsert({
      where: {
        rangeId_userId: { rangeId, userId: req.user.id },
      },
      create: {
        rangeId,
        userId: req.user.id,
        rating,
        body: reviewBody,
        visitDate: visitDate ? new Date(visitDate) : null,
      },
      update: { rating, body, visitDate: visitDate ? new Date(visitDate) : null },
    })
    res.status(201).json({ success: true, data: review })
  } catch (err) {
    console.error('[POST /api/reviews]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
