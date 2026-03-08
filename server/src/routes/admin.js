import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'

export const adminRouter = Router()

adminRouter.use(auth, requireRole('ADMIN'))

// GET /api/admin/ranges
adminRouter.get('/ranges', async (req, res) => {
  try {
    const ranges = await prisma.range.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: ranges })
  } catch (err) {
    console.error('[GET /api/admin/ranges]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/admin/claims
adminRouter.get('/claims', async (req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { status: 'PENDING' },
      include: { range: true, user: { select: { email: true, name: true } } },
    })
    res.json({ success: true, data: claims })
  } catch (err) {
    console.error('[GET /api/admin/claims]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/admin/stats
adminRouter.get('/stats', async (req, res) => {
  try {
    const [totalRanges, pendingClaims, totalReviews] = await Promise.all([
      prisma.range.count(),
      prisma.claim.count({ where: { status: 'PENDING' } }),
      prisma.review.count(),
    ])
    res.json({
      success: true,
      data: { totalRanges, pendingClaims, totalReviews },
    })
  } catch (err) {
    console.error('[GET /api/admin/stats]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
