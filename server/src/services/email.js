/**
 * Email service using Resend (optional).
 * Requires RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL in env.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@tacticalshack.com'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@tacticalshack.com'

async function send(from, to, subject, html) {
  if (!RESEND_API_KEY) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Resend error: ${res.status}`)
  }
}

export async function sendClaimApprovedEmail(claim) {
  if (!RESEND_API_KEY) return
  const { user, range } = claim
  const to = user?.email ?? claim.claimantEmail
  const subject = `Your claim for ${range.name} has been approved`
  const html = `
    <h2>Claim Approved</h2>
    <p>Your claim for <strong>${range.name}</strong> has been approved.</p>
    <p>You can now manage this listing at TacticalShack.</p>
    <p>— TacticalShack</p>
  `
  await send(EMAIL_FROM, to, subject, html)
}

export async function sendClaimSubmittedToAdmin(claim) {
  if (!ADMIN_EMAIL) return
  const { user, range } = claim
  const subject = `New claim for ${range.name}`
  const html = `
    <h2>New Range Claim</h2>
    <p><strong>Range:</strong> ${range.name}</p>
    <p><strong>Claimant:</strong> ${claim.claimantName} (${claim.claimantEmail})</p>
    <p><strong>Title:</strong> ${claim.claimantTitle}</p>
    <p>Review and process at the admin dashboard.</p>
  `
  await send(EMAIL_FROM, ADMIN_EMAIL, subject, html)
}
