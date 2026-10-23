import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { logAudit } from '../services/audit.js';

export function register(req, res) {
  try {
    const { full_name, email, password, role = 'voter' } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (!['voter', 'candidate'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either voter or candidate.' });
    }

    // Check unique email
    const existing = db.prepare('SELECT user_id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'A user with this email address already exists.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const voter_reference = `VOT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const stmt = db.prepare(`
      INSERT INTO users (full_name, email, password_hash, role, voter_reference, account_status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(full_name.trim(), email.toLowerCase().trim(), password_hash, role, voter_reference);
    const userId = result.lastInsertRowid;

    // Automatically enroll new voter into active elections
    const activeElections = db.prepare("SELECT election_id FROM elections WHERE election_status = 'active'").all();
    const enrollStmt = db.prepare(`
      INSERT OR IGNORE INTO voter_eligibility (voter_id, election_id, is_eligible, has_voted)
      VALUES (?, ?, 1, 0)
    `);
    for (const el of activeElections) {
      enrollStmt.run(userId, el.election_id);
    }

    logAudit({
      actor_user_id: userId,
      action_type: 'USER_REGISTERED',
      entity_type: 'USER',
      entity_reference: String(userId),
      details: { email: email.toLowerCase().trim(), role },
    });

    const token = jwt.sign({ user_id: userId, role }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        user_id: userId,
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        role,
        voter_reference,
        account_status: 'active',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      logAudit({
        actor_user_id: user.user_id,
        action_type: 'LOGIN_FAILED',
        entity_type: 'AUTH',
        entity_reference: user.email,
        details: 'Invalid password attempt',
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.account_status !== 'active') {
      return res.status(403).json({ error: `Account is ${user.account_status}. Please contact an administrator.` });
    }

    logAudit({
      actor_user_id: user.user_id,
      action_type: 'LOGIN_SUCCESS',
      entity_type: 'AUTH',
      entity_reference: user.email,
    });

    const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    const { password_hash, ...safeUser } = user;
    return res.json({
      message: 'Login successful!',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export function logout(req, res) {
  if (req.user) {
    logAudit({
      actor_user_id: req.user.user_id,
      action_type: 'LOGOUT',
      entity_type: 'AUTH',
      entity_reference: req.user.email,
    });
  }

  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
}

export function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user: req.user });
}

// Quick switch accounts for college demo/presentation
export function getDemoAccounts(req, res) {
  const accounts = db.prepare(`
    SELECT user_id, full_name, email, role, voter_reference 
    FROM users 
    ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'candidate' THEN 2 ELSE 3 END, user_id ASC
  `).all();
  return res.json({ accounts, defaultPassword: 'Password@123' });
}
