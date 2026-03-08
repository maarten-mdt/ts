import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'

export const claimsRouter = Router()

const claimSchema = z.object({
  rangeId: z.string().cuid(),
  claimantName: z.string().min(1),
  claimantTitle: z.string().min(1),
  claimantPhone: z.string().min(1),
  claimantEmail: z.string().email(),
  verificationNote: z.string().optional(),
})

// POST /api/claims — Submit claim (auth required)
claimsRouter.post('/', auth, requireRole('USER', 'RANGE_OWNER', 'GUNSMITH', 'ADMIN'), async (req, res) => {
  try {
    const body = claimSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.flatten() })
    }
    const { rangeId, ...data } = body.data

    const range = await prisma.range.findUnique({ where: { id: rangeId } })
    if (!range) return res.status(404).json({ success: false, error: 'Range not found' })
    if (range.claimed) return res.status(400).json({ success: false, error: 'Range already claimed' })

    const claim = await prisma.claim.create({
      data: {
        rangeId,
        userId: req.user.id,
        ...data,
      },
      include: { range: true, user: true },
    })
    try {
      const { sendClaimSubmittedToAdmin } = await import('../services/email.js')
      await sendClaimSubmittedToAdmin(claim)
    } catch (e) {
      console.warn('[claims] Admin email send failed:', e.message)
    }
    res.status(201).json({ success: true, data: claim })
  } catch (err) {
    console.error('[POST /api/claims]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/claims/:id/approve — ADMIN only
claimsRouter.patch('/:id/approve', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: { range: true, user: true },
    })
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' })
    if (claim.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Claim already processed' })
    }
    const range = await prisma.range.findUnique({ where: { id: claim.rangeId } })
    if (!range) return res.status(404).json({ success: false, error: 'Range not found' })
    if (range.claimed) {
      return res.status(400).json({ success: false, error: 'Range already claimed' })
    }

    await prisma.$transaction([
      prisma.claim.update({
        where: { id: claim.id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      }),
      prisma.range.update({
        where: { id: claim.rangeId },
        data: {
          claimed: true,
          ownerId: claim.userId,
          claimedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: claim.userId },
        data: { role: claim.user.role === 'ADMIN' ? 'ADMIN' : 'RANGE_OWNER' },
      }),
    ])

    try {
      const { sendClaimApprovedEmail } = await import('../services/email.js')
      await sendClaimApprovedEmail(claim)
    } catch (e) {
      console.warn('[claims] Email send failed:', e.message)
    }

    const updated = await prisma.claim.findUnique({
      where: { id: claim.id },
      include: { range: true, user: { select: { email: true, name: true } } },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[PATCH /api/claims/:id/approve]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/claims/:id/reject — ADMIN only
claimsRouter.patch('/:id/reject', auth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { adminNote } = req.body || {}
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: { range: true, user: true },
    })
    if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' })
    if (claim.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Claim already processed' })
    }

    const updated = await prisma.claim.update({
      where: { id: claim.id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        adminNote: adminNote ?? null,
      },
      include: { range: true, user: { select: { email: true, name: true } } },
    })
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error('[PATCH /api/claims/:id/reject]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
