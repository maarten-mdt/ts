/**
 * Role-based access control.
 * requireRole('ADMIN') — only ADMIN
 * requireRole('RANGE_OWNER', 'ADMIN') — RANGE_OWNER or ADMIN
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    next()
  }
}
