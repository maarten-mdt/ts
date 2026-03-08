import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { rangesRouter } from './routes/ranges.js'
import { claimsRouter } from './routes/claims.js'
import { reviewsRouter } from './routes/reviews.js'
import { adminRouter } from './routes/admin.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }))
app.use(express.json())
if (process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware())
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use('/api/ranges', rangesRouter)
app.use('/api/claims', claimsRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/admin', adminRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, error: err.message ?? 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`TacticalShack API listening on port ${PORT}`)
})
