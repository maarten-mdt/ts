import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'
import { refreshFflCache, verifyFflNumber } from '../services/fflVerification.js'

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
    const [totalRanges, pendingClaims, totalReviews, totalGunsmiths, pendingGunsmithClaims] = await Promise.all([
      prisma.range.count(),
      prisma.claim.count({ where: { status: 'PENDING' } }),
      prisma.review.count(),
      prisma.gunsmith.count(),
      prisma.gunsmithClaim.count({ where: { status: 'PENDING' } }),
    ])
    res.json({
      success: true,
      data: { totalRanges, pendingClaims, totalReviews, totalGunsmiths, pendingGunsmithClaims },
    })
  } catch (err) {
    console.error('[GET /api/admin/stats]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/admin/gunsmiths
adminRouter.get('/gunsmiths', async (req, res) => {
  try {
    const gunsmiths = await prisma.gunsmith.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: gunsmiths })
  } catch (err) {
    console.error('[GET /api/admin/gunsmiths]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/admin/ffl/sync
adminRouter.post('/ffl/sync', async (req, res) => {
  try {
    const result = await refreshFflCache()
    res.json({ success: true, data: result })
  } catch (err) {
    console.error('[POST /api/admin/ffl/sync]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/admin/ffl/sync-log
adminRouter.get('/ffl/sync-log', async (req, res) => {
  try {
    const logs = await prisma.fflSyncLog.findMany({
      orderBy: { syncedAt: 'desc' },
      take: 20,
    })
    res.json({ success: true, data: logs })
  } catch (err) {
    console.error('[GET /api/admin/ffl/sync-log]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/admin/ffl/verify/:id — verify a specific gunsmith's FFL
adminRouter.post('/ffl/verify/:id', async (req, res) => {
  try {
    const gunsmith = await prisma.gunsmith.findUnique({ where: { id: req.params.id } })
    if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    const fflNum = gunsmith.fflNumber
    if (!fflNum) return res.status(400).json({ success: false, error: 'No FFL number' })

    const result = await verifyFflNumber(fflNum)
    await prisma.gunsmith.update({
      where: { id: req.params.id },
      data: {
        fflVerified: result.valid,
        fflVerifiedAt: new Date(),
        fflExpiry: result.expiry ?? null,
        fflLicenseType: result.licenseType ?? gunsmith.fflLicenseType,
      },
    })
    res.json({ success: true, data: result })
  } catch (err) {
    console.error('[POST /api/admin/ffl/verify/:id]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/admin/ffl/expiring
adminRouter.get('/ffl/expiring', async (req, res) => {
  try {
    const sixtyDays = new Date()
    sixtyDays.setDate(sixtyDays.getDate() + 60)
    const gunsmiths = await prisma.gunsmith.findMany({
      where: {
        hasFfl: true,
        fflExpiry: { lte: sixtyDays, gte: new Date() },
      },
      orderBy: { fflExpiry: 'asc' },
    })
    res.json({ success: true, data: gunsmiths })
  } catch (err) {
    console.error('[GET /api/admin/ffl/expiring]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
