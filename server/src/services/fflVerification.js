/**
 * FFL Verification Service — ATF database sync and lookup
 * Downloads the ATF FFL licensee list (pipe-delimited), parses with streams,
 * stores in FflCache for verification.
 * ATF columns: LIC_REGN|LIC_DIST|LIC_CNTY|LIC_TYPE|LIC_XPRDTE|LIC_SEQN|LICENSE_NAME|BUSINESS_NAME|PREMISE_STREET|PREMISE_CITY|PREMISE_STATE|...
 */

import { createReadStream, existsSync, mkdirSync } from 'fs'
import { createInterface } from 'readline'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../lib/prisma.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ATF FFL file URL — monthly pipe-delimited listing (MMYY_ffl_list.txt)
const ATF_BASE = 'https://www.atf.gov/sites/default/files/ffl_txt'

/** Normalize FFL number to X-XX-XXX-XX-XX-XXXXX format (strip dashes/spaces, reformat) */
export function normalizeFflNumber(input) {
  if (!input || typeof input !== 'string') return null
  const cleaned = input.replace(/[\s\-]/g, '')
  if (cleaned.length < 10) return null
  // ATF format: X-XX-XXX-XX-XX-XXXXX (1-2-3-2-2-5)
  const m = cleaned.match(/^(\d)(\d{2})(\d{3})(\d{2})(\d{2})(\d{5})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}-${m[6]}`
  return cleaned
}

/**
 * Verify an FFL number against the cached ATF database.
 * @returns {Promise<{valid: boolean, licenseType?: string, businessName?: string, city?: string, state?: string, expiry?: Date, lastChecked?: Date}>}
 */
export async function verifyFflNumber(fflNumber) {
  const normalized = normalizeFflNumber(fflNumber)
  if (!normalized) return { valid: false }

  const cached = await prisma.fflCache.findUnique({
    where: { fflNumber: normalized },
  })

  if (!cached) return { valid: false }

  const expiry = cached.expiryDate
  const isExpired = expiry && new Date(expiry) < new Date()

  return {
    valid: !isExpired,
    licenseType: cached.licenseType,
    businessName: cached.businessName,
    city: cached.premisesCity,
    state: cached.premisesState,
    expiry: expiry,
    lastChecked: cached.lastSynced,
  }
}

/**
 * Refresh FFL cache — download ATF file, parse with streams, upsert into FflCache.
 * Logs result to FflSyncLog.
 */
export async function refreshFflCache() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const url = `${ATF_BASE}/${month}${year}_ffl_list.txt`

  let recordCount = 0
  let errorNote = null

  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) {
      throw new Error(`ATF fetch failed: ${res.status} ${res.statusText}`)
    }

    const tmpDir = path.join(__dirname, '../../tmp')
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
    const tmpFile = path.join(tmpDir, `ffl_${Date.now()}.txt`)

    const buffer = Buffer.from(await res.arrayBuffer())
    const { writeFile } = await import('fs/promises')
    await writeFile(tmpFile, buffer)

    const fileStream = createReadStream(tmpFile)
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity })

    let headerRow = true
    const batchSize = 2000
    let batch = []

    for await (const line of rl) {
      const cols = line.split('|').map((c) => c.trim())

      if (headerRow) {
        headerRow = false
        continue
      }
      if (cols.length < 8) continue

      // ATF format: LIC_REGN(0) | LIC_DIST(1) | LIC_CNTY(2) | LIC_TYPE(3) | LIC_XPRDTE(4) | LIC_SEQN(5) | LICENSE_NAME(6) | BUSINESS_NAME(7) | PREMISE_CITY(9) | PREMISE_STATE(10)
      const regn = cols[0] ?? ''
      const dist = (cols[1] ?? '').padStart(2, '0')
      const cnty = (cols[2] ?? '').padStart(3, '0')
      const type = (cols[3] ?? '').padStart(2, '0')
      const seqn = (cols[5] ?? '').padStart(5, '0')
      const fflNum = `${regn}-${dist}-${cnty}-${type}-${seqn}`

      const businessName = cols[7] ?? cols[6] ?? ''
      const premisesCity = cols[9] ?? ''
      const premisesState = cols[10] ?? ''
      const licenseType = cols[3] ?? ''
      const expiryDate = cols[4] ?? ''

      if (!regn || !businessName) continue

      const normalized = normalizeFflNumber(fflNum)
      if (!normalized) continue

      let expDate
      if (expiryDate) {
        const m = String(expiryDate).match(/^(\d{2})(\d{2})(\d{4})$/)
        if (m) expDate = new Date(`${m[3]}-${m[1]}-${m[2]}`)
        else if (!isNaN(Date.parse(expiryDate))) expDate = new Date(expiryDate)
      }
      if (!expDate || isNaN(expDate.getTime())) expDate = new Date('2099-12-31')

      const rec = {
        fflNumber: normalized,
        businessName: businessName.slice(0, 500),
        premisesCity: premisesCity.slice(0, 100),
        premisesState: premisesState.slice(0, 10),
        licenseType: String(licenseType).slice(0, 20),
        expiryDate: expDate,
        rawRecord: line.slice(0, 2000),
      }

      batch.push(rec)
      recordCount++

      if (batch.length >= batchSize) {
        await upsertBatch(batch)
        batch = []
      }
    }

    if (batch.length) await upsertBatch(batch)

    const { unlink } = await import('fs/promises')
    await unlink(tmpFile).catch(() => {})
  } catch (err) {
    errorNote = err.message
    console.error('[fflVerification] refreshFflCache:', err)
  }

  await prisma.fflSyncLog.create({
    data: { recordCount, success: !errorNote, errorNote },
  })

  return { recordCount, success: !errorNote, errorNote }
}

async function upsertBatch(records) {
  for (const r of records) {
    await prisma.fflCache.upsert({
      where: { fflNumber: r.fflNumber },
      create: r,
      update: r,
    })
  }
}
