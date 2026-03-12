import { clerkClient, getAuth } from '@clerk/express'
import { prisma } from '../lib/prisma.js'

/**
 * Auth middleware — supports both Clerk session (web users) and Bearer API key (AI agent).
 * Sets req.user = { id, clerkId, email, role } on success.
 * Requires clerkMiddleware() to run first for Clerk auth.
 */
export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    // API Key auth (Bearer token) — try first for AI agent
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      // API keys from cuid() don't contain dots; JWTs do
      if (!token.includes('.')) {
        const apiKey = await prisma.apiKey.findUnique({
          where: { key: token, active: true },
          include: { user: true },
        })
        if (apiKey) {
          await prisma.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsed: new Date() },
          })
          req.user = {
            id: apiKey.user.id,
            clerkId: apiKey.user.clerkId,
            email: apiKey.user.email,
            role: apiKey.role,
          }
          return next()
        }
      }
    }

    // Clerk auth (from clerkMiddleware)
    const { userId } = getAuth(req)
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId)
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.user`,
          name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || null,
        },
      })
    }

    req.user = {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
    }
    next()
  } catch (err) {
    console.error('[auth]', err)
    res.status(401).json({ success: false, error: 'Unauthorized' })
  }
}

/**
 * Optional auth — sets req.user if authenticated, but does not require it.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      if (!token.includes('.')) {
        const apiKey = await prisma.apiKey.findUnique({
          where: { key: token, active: true },
          include: { user: true },
        })
        if (apiKey) {
          req.user = {
            id: apiKey.user.id,
            clerkId: apiKey.user.clerkId,
            email: apiKey.user.email,
            role: apiKey.role,
          }
          return next()
        }
      }
    }

    const { userId } = getAuth(req)
    if (!userId) return next()

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })
    if (user) {
      req.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
      }
    }
    next()
  } catch {
    next()
  }
}
