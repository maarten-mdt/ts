import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'
import { verifyFflNumber, normalizeFflNumber } from '../services/fflVerification.js'

export const gunsmithClaimsRouter = Router()

const claimSchema = z.object({
  gunsmithId: z.string().cuid(),
  claimantName: z.string().min(1),
  claimantTitle: z.string().min(1),
  claimantPhone: z.string().min(1),
  claimantEmail: z.string().email(),
  fflNumber: z.string().optional(),
  verificationNote: z.string().optional(),
})

// POST /api/gunsmith-claims — Auth: any logged-in user
gunsmithClaimsRouter.post('/', auth, requireRole('USER', 'RANGE_OWNER', 'GUNSMITH', 'ADMIN'), async (req, res) => {
  try {
    const body = claimSchema.safeParse(req.body)
    if (!body.success) return res.status(400).json({ success: false, error: body.error.flatten() })
    const { gunsmithId, ...data } = body.data

    const gunsmith = await prisma.gunsmith.findUnique({ where: { id: gunsmithId } })
    if (!gunsmith) return res.status(404).json({ success: false, error: 'Gunsmith not found' })
    if (gunsmith.claimed) return res.status(400).json({ success: false, error: 'Gunsmith already claimed' })

    const claim = await prisma.gunsmithClaim.create({
      data: {
        gunsmithId,
        userId: req.user.id,
        ...data,
        fflNumber: data.fflNumber ? normalizeFflNumber(data.fflNumber) : null,
      },
      include: { gunsmith: true, user: true },
    })

    try {
      const { sendGunsmithClaimSubmittedToAdmin } = await import('../services/email.js')
      await sendGunsmithClaimSubmittedToAdmin(claim)
    } catch (e) {
      console.warn('[gunsmith-claims] Admin email failed:', e.message)
    }

    res.status(201).json({ success: true, data: claim })
  } catch (err) {
    console.error('[POST /api/gunsmith-claims]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gunsmith-claims — Auth: ADMIN
gunsmithClaimsRouter.get('/', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const status = req.query.status
    const where = status ? { status } : {}
    const claims = await prisma.gunsmithClaim.findMany({
      where,
      include: { gunsmith: true, user: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: claims })
  } catch (err) {
    console.error('[GET /api/gunsmith-claims]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gunsmith-claims/:id — Auth: ADMIN or claim owner
gunsmithClaimsRouter.get('/:id', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const claim = await prisma.gunsmithClaim.findUnique({
      where: { id: req.params.id },
      include: { gunsmith: true, user: { select: { email: true, name: true } } },
    })
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' })
    if (claim.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    res.json({ success: true, data: claim })
  } catch (err) {
    console.error('[GET /api/gunsmith-claims/:id]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/gunsmith-claims/:id/approve — Auth: ADMIN
gunsmithClaimsRouter.patch('/:id/approve', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const claim = await prisma.gunsmithClaim.findUnique({
      where: { id: req.params.id },
      include: { gunsmith: true, user: true },
    })
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' })
    if (claim.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Claim already processed' })
    if (claim.gunsmith.claimed) return res.status(400).json({ success: false, error: 'Gunsmith already claimed' })

    let fflVerified = claim.gunsmith.fflVerified
    let fflExpiry = claim.gunsmith.fflExpiry
    let fflLicenseType = claim.gunsmith.fflLicenseType

    const fflToVerify = claim.fflNumber ?? claim.gunsmith.fflNumber
    if (fflToVerify && claim.gunsmith.country === 'US') {
      const result = await verifyFflNumber(fflToVerify)
      fflVerified = result.valid
      fflExpiry = result.expiry ?? null
      fflLicenseType = result.licenseType ?? claim.gunsmith.fflLicenseType
    }

    await prisma.$transaction([
      prisma.gunsmithClaim.update({
        where: { id: claim.id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      }),
      prisma.gunsmith.update({
        where: { id: claim.gunsmithId },
        data: {
          claimed: true,
          ownerId: claim.userId,
          claimedAt: new Date(),
          fflNumber: fflToVerify ? normalizeFflNumber(fflToVerify) : claim.gunsmith.fflNumber,
          fflVerified,
          fflVerifiedAt: new Date(),
          fflExpiry,
          fflLicenseType,
          hasFfl: !!fflToVerify,
        },
      }),
      prisma.user.update({
        where: { id: claim.userId },
        data: { role: claim.user.role === 'ADMIN' ? 'ADMIN' : 'GUNSMITH' },
      }),
    ])

    try {
      const { sendGunsmithClaimApprovedEmail } = await import('../services/email.js')
      await sendGunsmithClaimApprovedEmail(claim)
    } catch (e) {
      console.warn('[gunsmith-claims] Email failed:', e.message)
    }

    const updated = await prisma.gunsmithClaim.findUnique({
      where: { id: claim.id },
      include: { gunsmith: true, user: { select: { email: true, name: true } } },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[PATCH /api/gunsmith-claims/:id/approve]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/gunsmith-claims/:id/reject — Auth: ADMIN
gunsmithClaimsRouter.patch('/:id/reject', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { adminNote } = req.body ?? {}
    const claim = await prisma.gunsmithClaim.findUnique({
      where: { id: req.params.id },
      include: { gunsmith: true, user: { select: { email: true, name: true } } },
    })
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' })
    if (claim.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Claim already processed' })

    const updated = await prisma.gunsmithClaim.update({
      where: { id: claim.id },
      data: { status: 'REJECTED', reviewedAt: new Date(), adminNote: adminNote ?? null },
      include: { gunsmith: true, user: { select: { email: true, name: true } } },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[PATCH /api/gunsmith-claims/:id/reject]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
