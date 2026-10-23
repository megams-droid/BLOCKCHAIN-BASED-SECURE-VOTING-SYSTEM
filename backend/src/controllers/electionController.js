import { db } from '../config/db.js';
import { initializeElectionGenesisBlock } from '../services/blockchain.js';
import { logAudit } from '../services/audit.js';

export function getElections(req, res) {
  try {
    const currentUserId = req.user?.user_id || 0;

    const elections = db.prepare(`
      SELECT 
        e.*,
        u.full_name as creator_name,
        (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.election_id) as candidate_count,
        (SELECT COUNT(*) FROM voter_eligibility ve WHERE ve.election_id = e.election_id AND ve.is_eligible = 1) as eligible_voters_count,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.election_id) as total_votes_cast,
        ve.is_eligible as current_user_eligible,
        ve.has_voted as current_user_has_voted,
        ve.voted_at as current_user_voted_at
      FROM elections e
      LEFT JOIN users u ON e.created_by = u.user_id
      LEFT JOIN voter_eligibility ve ON e.election_id = ve.election_id AND ve.voter_id = ?
      ORDER BY 
        CASE e.election_status 
          WHEN 'active' THEN 1 
          WHEN 'upcoming' THEN 2 
          ELSE 3 
        END,
        e.start_time DESC
    `).all(currentUserId);

    return res.json({ elections });
  } catch (error) {
    console.error('getElections error:', error);
    return res.status(500).json({ error: 'Failed to retrieve elections.' });
  }
}

export function getElectionById(req, res) {
  try {
    const electionId = Number(req.params.id);
    const currentUserId = req.user?.user_id || 0;

    const election = db.prepare(`
      SELECT 
        e.*,
        u.full_name as creator_name,
        (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.election_id) as candidate_count,
        (SELECT COUNT(*) FROM voter_eligibility ve WHERE ve.election_id = e.election_id AND ve.is_eligible = 1) as eligible_voters_count,
        (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.election_id) as total_votes_cast,
        ve.is_eligible as current_user_eligible,
        ve.has_voted as current_user_has_voted
      FROM elections e
      LEFT JOIN users u ON e.created_by = u.user_id
      LEFT JOIN voter_eligibility ve ON e.election_id = ve.election_id AND ve.voter_id = ?
      WHERE e.election_id = ?
    `).get(currentUserId, electionId);

    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    const candidates = db.prepare(`
      SELECT candidate_id, user_id, election_id, candidate_name, party_or_group, manifesto, created_at
      FROM candidates
      WHERE election_id = ?
      ORDER BY candidate_name ASC
    `).all(electionId);

    return res.json({ election, candidates });
  } catch (error) {
    console.error('getElectionById error:', error);
    return res.status(500).json({ error: 'Failed to retrieve election details.' });
  }
}

export function createElection(req, res) {
  try {
    const { election_name, description, start_time, end_time, election_status = 'upcoming' } = req.body;

    if (!election_name || !start_time || !end_time) {
      return res.status(400).json({ error: 'Election name, start time, and end time are required.' });
    }

    const created_by = req.user.user_id;

    const stmt = db.prepare(`
      INSERT INTO elections (election_name, description, start_time, end_time, election_status, results_published, created_by)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);

    const result = stmt.run(election_name.trim(), description || '', start_time, end_time, election_status, created_by);
    const electionId = result.lastInsertRowid;

    // Automatically create Genesis Block in blockchain_blocks for this election
    initializeElectionGenesisBlock(electionId);

    // Enroll all active voters automatically
    const voters = db.prepare("SELECT user_id FROM users WHERE role = 'voter' AND account_status = 'active'").all();
    const enrollStmt = db.prepare(`
      INSERT OR IGNORE INTO voter_eligibility (voter_id, election_id, is_eligible, has_voted)
      VALUES (?, ?, 1, 0)
    `);
    for (const v of voters) {
      enrollStmt.run(v.user_id, electionId);
    }

    logAudit({
      actor_user_id: req.user.user_id,
      action_type: 'ELECTION_CREATED',
      entity_type: 'ELECTION',
      entity_reference: String(electionId),
      details: { election_name, election_status },
    });

    return res.status(201).json({
      message: 'Election created successfully with blockchain genesis block!',
      electionId,
    });
  } catch (error) {
    console.error('createElection error:', error);
    return res.status(500).json({ error: 'Failed to create election.' });
  }
}

export function updateElection(req, res) {
  try {
    const electionId = Number(req.params.id);
    const { election_name, description, start_time, end_time } = req.body;

    const existing = db.prepare('SELECT * FROM elections WHERE election_id = ?').get(electionId);
    if (!existing) return res.status(404).json({ error: 'Election not found.' });

    db.prepare(`
      UPDATE elections
      SET election_name = COALESCE(?, election_name),
          description = COALESCE(?, description),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time)
      WHERE election_id = ?
    `).run(election_name, description, start_time, end_time, electionId);

    logAudit({
      actor_user_id: req.user.user_id,
      action_type: 'ELECTION_UPDATED',
      entity_type: 'ELECTION',
      entity_reference: String(electionId),
    });

    return res.json({ message: 'Election updated successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update election.' });
  }
}

export function updateStatus(req, res) {
  try {
    const electionId = Number(req.params.id);
    const { status, results_published } = req.body;

    const existing = db.prepare('SELECT * FROM elections WHERE election_id = ?').get(electionId);
    if (!existing) return res.status(404).json({ error: 'Election not found.' });

    if (status && !['upcoming', 'active', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid election status.' });
    }

    const newStatus = status || existing.election_status;
    const newPublished = results_published !== undefined ? (results_published ? 1 : 0) : existing.results_published;

    db.prepare(`
      UPDATE elections
      SET election_status = ?, results_published = ?
      WHERE election_id = ?
    `).run(newStatus, newPublished, electionId);

    logAudit({
      actor_user_id: req.user.user_id,
      action_type: 'ELECTION_STATUS_CHANGED',
      entity_type: 'ELECTION',
      entity_reference: String(electionId),
      details: { from: existing.election_status, to: newStatus, results_published: newPublished },
    });

    return res.json({ message: 'Election status updated successfully.', status: newStatus, results_published: newPublished });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update election status.' });
  }
}
