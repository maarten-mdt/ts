import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { auth } from '../middleware/auth.js'

export const nfaSubmissionsRouter = Router()

const FORM_TYPES = ['FORM_1', 'FORM_4', 'EFORM_1', 'EFORM_4']
const ITEM_TYPES = ['SUPPRESSOR', 'SBR', 'SBS', 'MG', 'AOW']
const STATUSES = ['PENDING', 'APPROVED', 'DENIED']
const TRUST_OR_INDIVIDUAL = ['TRUST', 'INDIVIDUAL']

const createSchema = z.object({
  formType: z.enum(FORM_TYPES),
  itemType: z.enum(ITEM_TYPES),
  submittedDate: z.union([z.string(), z.date()]),
  approvedDate: z.union([z.string(), z.date()]).optional().nullable(),
  examinerName: z.string().max(200).optional().nullable(),
  status: z.enum(STATUSES).default('PENDING'),
  trustOrIndividual: z.enum(TRUST_OR_INDIVIDUAL),
  notes: z.string().max(2000).optional().nullable(),
})

// GET /api/nfa-submissions/stats — Public: average wait times by form type
nfaSubmissionsRouter.get('/stats', async (req, res) => {
  try {
    const approved = await prisma.nfaSubmission.findMany({
      where: {
        status: 'APPROVED',
        approvedDate: { not: null },
      },
      select: {
        formType: true,
        submittedDate: true,
        approvedDate: true,
      },
    })

    const byFormType = {}
    for (const row of approved) {
      if (!row.approvedDate) continue
      const days = Math.round((new Date(row.approvedDate) - new Date(row.submittedDate)) / (24 * 60 * 60 * 1000))
      if (!byFormType[row.formType]) byFormType[row.formType] = { count: 0, totalDays: 0 }
      byFormType[row.formType].count += 1
      byFormType[row.formType].totalDays += days
    }

    const stats = Object.entries(byFormType).map(([formType, { count, totalDays }]) => ({
      formType,
      count,
      avgWaitDays: Math.round(totalDays / count),
    }))

    const totalCount = await prisma.nfaSubmission.count()
    const pendingCount = await prisma.nfaSubmission.count({ where: { status: 'PENDING' } })

    res.json({
      success: true,
      data: {
        byFormType: stats,
        totalSubmissions: totalCount,
        pendingSubmissions: pendingCount,
      },
    })
  } catch (err) {
    console.error('[GET /api/nfa-submissions/stats]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/nfa-submissions — Auth: list current user's submissions
nfaSubmissionsRouter.get('/', auth, async (req, res) => {
  try {
    const list = await prisma.nfaSubmission.findMany({
      where: { userId: req.user.id },
      orderBy: { submittedDate: 'desc' },
    })
    res.json({ success: true, data: list })
  } catch (err) {
    console.error('[GET /api/nfa-submissions]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/nfa-submissions — Auth: create submission
nfaSubmissionsRouter.post('/', auth, async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() })
    }
    const data = {
      userId: req.user.id,
      formType: parsed.data.formType,
      itemType: parsed.data.itemType,
      submittedDate: new Date(parsed.data.submittedDate),
      approvedDate: parsed.data.approvedDate ? new Date(parsed.data.approvedDate) : null,
      examinerName: parsed.data.examinerName ?? null,
      status: parsed.data.status,
      trustOrIndividual: parsed.data.trustOrIndividual,
      notes: parsed.data.notes ?? null,
    }
    const submission = await prisma.nfaSubmission.create({ data })
    res.status(201).json({ success: true, data: submission })
  } catch (err) {
    console.error('[POST /api/nfa-submissions]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})
