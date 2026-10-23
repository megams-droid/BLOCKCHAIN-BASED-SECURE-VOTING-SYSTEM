import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_voting_super_secret_jwt_key_2026';

export function authenticate(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user from DB
    const user = db.prepare(`
      SELECT user_id, full_name, email, role, voter_reference, account_status, created_at
      FROM users WHERE user_id = ?
    `).get(decoded.user_id);

    if (!user || user.account_status !== 'active') {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}
