import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { auth, optionalAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'

export const reviewsRouter = Router()

const rangeReviewSchema = z.object({
  rangeId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  body: z.string().min(10),
  visitDate: z.string().optional(),
})
const gunsmithReviewSchema = z.object({
  gunsmithId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  body: z.string().min(10),
  visitDate: z.string().optional(),
})

// GET /api/reviews?rangeId=xxx or ?gunsmithId=xxx — Public
reviewsRouter.get('/', async (req, res) => {
  try {
    const rangeId = req.query.rangeId
    const gunsmithId = req.query.gunsmithId
    if (!rangeId && !gunsmithId) return res.status(400).json({ success: false, error: 'rangeId or gunsmithId required' })
    if (rangeId && gunsmithId) return res.status(400).json({ success: false, error: 'Provide rangeId or gunsmithId, not both' })

    const where = rangeId ? { rangeId } : { gunsmithId }
    const reviews = await prisma.review.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: reviews })
  } catch (err) {
    console.error('[GET /api/reviews]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/reviews — Submit review (auth required); rangeId or gunsmithId
reviewsRouter.post('/', auth, requireRole('USER', 'RANGE_OWNER', 'GUNSMITH', 'ADMIN'), async (req, res) => {
  try {
    const rangeBody = rangeReviewSchema.safeParse(req.body)
    const gunsmithBody = gunsmithReviewSchema.safeParse(req.body)
    if (rangeBody.success) {
      const { rangeId, rating, body: reviewBody, visitDate } = rangeBody.data
      const range = await prisma.range.findUnique({ where: { id: rangeId } })
      if (!range) return res.status(404).json({ success: false, error: 'Range not found' })
      const review = await prisma.review.upsert({
        where: { rangeId_userId: { rangeId, userId: req.user.id } },
        create: { rangeId, userId: req.user.id, rating, body: reviewBody, visitDate: visitDate ? new Date(visitDate) : null },
        update: { rating, body: reviewBody, visitDate: visitDate ? new Date(visitDate) : null },
      })
      return res.status(201).json({ success: true, data: review })
    }
    if (gunsmithBody.success) {
      const { gunsmithId, rating, body: reviewBody, visitDate } = gunsmithBody.data
      const gunsmith = await prisma.gunsmith.findUnique({ where: { id: gunsmithId } })
      if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
      const review = await prisma.review.upsert({
        where: { gunsmithId_userId: { gunsmithId, userId: req.user.id } },
        create: { gunsmithId, userId: req.user.id, rating, body: reviewBody, visitDate: visitDate ? new Date(visitDate) : null },
        update: { rating, body: reviewBody, visitDate: visitDate ? new Date(visitDate) : null },
      })
      return res.status(201).json({ success: true, data: review })
    }
    return res.status(400).json({ success: false, error: 'rangeId or gunsmithId required' })
  } catch (err) {
    console.error('[POST /api/reviews]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
