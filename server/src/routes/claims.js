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
    })
    // TODO: Send email to admin via Resend
    res.status(201).json({ success: true, data: claim })
  } catch (err) {
    console.error('[POST /api/claims]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
