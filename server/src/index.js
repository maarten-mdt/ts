import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { rangesRouter } from './routes/ranges.js'
import { claimsRouter } from './routes/claims.js'
import { reviewsRouter } from './routes/reviews.js'
import { gunsmithsRouter } from './routes/gunsmiths.js'
import { gunsmithClaimsRouter } from './routes/gunsmith-claims.js'
import { adminRouter } from './routes/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.CLIENT_URL ?? true, credentials: true }))
app.use(express.json())
if (process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware())
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', ts: new Date().toISOString() })
})

app.use('/api/ranges', rangesRouter)
app.use('/api/claims', claimsRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/gunsmiths', gunsmithsRouter)
app.use('/api/gunsmith-claims', gunsmithClaimsRouter)
app.use('/api/admin', adminRouter)

// Serve built frontend (when deployed with client built)
const clientDist = path.resolve(__dirname, '../../client/dist')
if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, error: err.message ?? 'Internal server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TacticalShack API listening on port ${PORT}`)
}).on('error', (err) => {
  console.error('Server failed to start:', err)
  process.exit(1)
})
