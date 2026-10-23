import { db } from '../config/db.js';
import { logAudit } from '../services/audit.js';

export function getCandidates(req, res) {
  try {
    const electionId = Number(req.params.id);
    const candidates = db.prepare(`
      SELECT c.*, u.email as candidate_email
      FROM candidates c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.election_id = ?
      ORDER BY c.candidate_name ASC
    `).all(electionId);

    return res.json({ candidates });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve candidates.' });
  }
}

export function createCandidate(req, res) {
  try {
    const electionId = Number(req.params.id);
    const { user_id, candidate_name, party_or_group, manifesto } = req.body;

    if (!candidate_name || !party_or_group) {
      return res.status(400).json({ error: 'Candidate name and party/group are required.' });
    }

    // Verify user exists or if not provided, link to candidate user or create profile
    let targetUserId = user_id;
    if (!targetUserId) {
      // Find candidate user or fallback
      const candidateUser = db.prepare("SELECT user_id FROM users WHERE role = 'candidate' LIMIT 1").get();
      targetUserId = candidateUser ? candidateUser.user_id : req.user.user_id;
    }

    const stmt = db.prepare(`
      INSERT INTO candidates (user_id, election_id, candidate_name, party_or_group, manifesto)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(targetUserId, electionId, candidate_name.trim(), party_or_group.trim(), manifesto || '');

    logAudit({
      actor_user_id: req.user.user_id,
      action_type: 'CANDIDATE_NOMINATED',
      entity_type: 'CANDIDATE',
      entity_reference: String(result.lastInsertRowid),
      details: { election_id: electionId, candidate_name },
    });

    return res.status(201).json({
      message: 'Candidate added successfully!',
      candidate_id: result.lastInsertRowid,
    });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This candidate user is already registered for this election.' });
    }
    console.error('createCandidate error:', error);
    return res.status(500).json({ error: 'Failed to add candidate.' });
  }
}

export function updateCandidate(req, res) {
  try {
    const candidateId = Number(req.params.id);
    const { manifesto, party_or_group } = req.body;

    const candidate = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?').get(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate record not found.' });
    }

    // Ensure only the candidate or admin can update
    if (req.user.role !== 'admin' && req.user.user_id !== candidate.user_id) {
      return res.status(403).json({ error: 'You are only permitted to update your own candidate profile.' });
    }

    db.prepare(`
      UPDATE candidates
      SET manifesto = COALESCE(?, manifesto),
          party_or_group = COALESCE(?, party_or_group)
      WHERE candidate_id = ?
    `).run(manifesto, party_or_group, candidateId);

    logAudit({
      actor_user_id: req.user.user_id,
      action_type: 'CANDIDATE_UPDATED',
      entity_type: 'CANDIDATE',
      entity_reference: String(candidateId),
    });

    return res.json({ message: 'Candidate details updated successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update candidate.' });
  }
}
