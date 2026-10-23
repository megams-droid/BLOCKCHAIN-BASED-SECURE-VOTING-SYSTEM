import { db } from '../config/db.js';
import { verifyBlockchain } from '../services/blockchain.js';

export function getAdminDashboard(req, res) {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalVoters = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'voter'").get().count;
    const totalCandidates = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'candidate'").get().count;
    const totalElections = db.prepare('SELECT COUNT(*) as count FROM elections').get().count;
    const activeElections = db.prepare("SELECT COUNT(*) as count FROM elections WHERE election_status = 'active'").get().count;
    const closedElections = db.prepare("SELECT COUNT(*) as count FROM elections WHERE election_status = 'closed'").get().count;
    const totalVotes = db.prepare('SELECT COUNT(*) as count FROM votes').get().count;
    const totalBlocks = db.prepare('SELECT COUNT(*) as count FROM blockchain_blocks').get().count;

    // Turnout across all elections
    const turnoutStats = db.prepare(`
      SELECT 
        COUNT(*) as total_eligible,
        SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) as total_voted
      FROM voter_eligibility
      WHERE is_eligible = 1
    `).get();

    const overallTurnout =
      turnoutStats.total_eligible > 0
        ? Number(((turnoutStats.total_voted / turnoutStats.total_eligible) * 100).toFixed(2))
        : 0;

    // Check ledger status of first active or latest election
    const latestElection = db.prepare('SELECT election_id, election_name FROM elections ORDER BY election_id DESC LIMIT 1').get();
    let ledgerStatus = 'No elections initialized';
    let isLedgerValid = true;

    if (latestElection) {
      const v = verifyBlockchain(latestElection.election_id);
      ledgerStatus = v.status;
      isLedgerValid = v.isValid;
    }

    return res.json({
      metrics: {
        total_registered_users: totalUsers,
        total_voters: totalVoters,
        total_candidates: totalCandidates,
        total_elections: totalElections,
        active_elections: activeElections,
        closed_elections: closedElections,
        total_votes_cast: totalVotes,
        total_blockchain_blocks: totalBlocks,
        overall_turnout_percentage: overallTurnout,
        ledger_status: ledgerStatus,
        is_ledger_valid: isLedgerValid,
      },
      latest_election: latestElection,
    });
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin dashboard metrics.' });
  }
}

export function getAuditLogs(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    // Syllabus Query F: Join audit_logs with users table
    const logs = db.prepare(`
      SELECT 
        a.log_id,
        a.actor_user_id,
        a.action_type,
        a.entity_type,
        a.entity_reference,
        a.details,
        a.created_at,
        u.full_name as actor_name,
        u.email as actor_email,
        u.role as actor_role
      FROM audit_logs a
      LEFT JOIN users u ON a.actor_user_id = u.user_id
      ORDER BY a.log_id DESC
      LIMIT ?
    `).all(limit);

    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}

export function getElectionReport(req, res) {
  try {
    const electionId = Number(req.params.electionId);

    const election = db.prepare('SELECT * FROM elections WHERE election_id = ?').get(electionId);
    if (!election) return res.status(404).json({ error: 'Election not found.' });

    const turnout = db.prepare('SELECT * FROM view_election_turnout WHERE election_id = ?').get(electionId);
    const candidateStandings = db.prepare('SELECT * FROM view_candidate_vote_totals WHERE election_id = ? ORDER BY total_votes DESC').all(electionId);
    const blockchainSummary = db.prepare('SELECT * FROM view_blockchain_summary WHERE election_id = ?').get(electionId);
    const verification = verifyBlockchain(electionId);

    return res.json({
      election,
      turnout,
      candidate_standings: candidateStandings,
      blockchain_summary: blockchainSummary,
      ledger_verification: verification,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate election report.' });
  }
}

export function getAllUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT user_id, full_name, email, role, voter_reference, account_status, created_at
      FROM users
      ORDER BY user_id ASC
    `).all();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to list users.' });
  }
}

export function toggleUserStatus(req, res) {
  try {
    const userId = Number(req.params.userId);
    const { status } = req.body;

    if (!['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid user status.' });
    }

    db.prepare('UPDATE users SET account_status = ? WHERE user_id = ?').run(status, userId);
    return res.json({ message: `User status changed to ${status}.` });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
}

export function toggleVoterEligibility(req, res) {
  try {
    const { voter_id, election_id, is_eligible } = req.body;

    if (!voter_id || !election_id) {
      return res.status(400).json({ error: 'voter_id and election_id required.' });
    }

    const eligibleVal = is_eligible ? 1 : 0;
    const stmt = db.prepare(`
      INSERT INTO voter_eligibility (voter_id, election_id, is_eligible, has_voted)
      VALUES (?, ?, ?, 0)
      ON CONFLICT(voter_id, election_id) DO UPDATE SET is_eligible = excluded.is_eligible
    `);

    stmt.run(voter_id, election_id, eligibleVal);
    return res.json({ message: 'Voter eligibility updated successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update voter eligibility.' });
  }
}

// Live DBMS Syllabus Demo Endpoints for College Presentation / Viva
export function runSqlDemo(req, res) {
  try {
    const queries = [
      {
        title: 'Query A: Display Candidates for Active Election',
        sql: `SELECT candidate_id, candidate_name, party_or_group, manifesto FROM candidates WHERE election_id = 1 ORDER BY candidate_name ASC`,
        results: db.prepare(`SELECT candidate_id, candidate_name, party_or_group, manifesto FROM candidates WHERE election_id = 1 ORDER BY candidate_name ASC`).all(),
      },
      {
        title: 'Query B: Count Eligible Voters per Election',
        sql: `SELECT election_id, COUNT(*) AS eligible_voters FROM voter_eligibility WHERE is_eligible = 1 GROUP BY election_id`,
        results: db.prepare(`SELECT election_id, COUNT(*) AS eligible_voters FROM voter_eligibility WHERE is_eligible = 1 GROUP BY election_id`).all(),
      },
      {
        title: 'Query C: Calculate Turnout with Conditional SUM(CASE ...)',
        sql: `SELECT election_id, COUNT(*) AS eligible_voters, SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS voters_participated, ROUND((CAST(SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS REAL) * 100.0) / COUNT(*), 2) AS turnout_rate FROM voter_eligibility WHERE is_eligible = 1 GROUP BY election_id`,
        results: db.prepare(`SELECT election_id, COUNT(*) AS eligible_voters, SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS voters_participated, ROUND((CAST(SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS REAL) * 100.0) / COUNT(*), 2) AS turnout_rate FROM voter_eligibility WHERE is_eligible = 1 GROUP BY election_id`).all(),
      },
      {
        title: 'Query D: Candidate Totals (LEFT JOIN votes v ON c.candidate_id = v.candidate_id)',
        sql: `SELECT c.candidate_id, c.candidate_name, c.party_or_group, COUNT(v.vote_id) AS total_votes FROM candidates c LEFT JOIN votes v ON c.candidate_id = v.candidate_id AND c.election_id = v.election_id WHERE c.election_id = 1 GROUP BY c.candidate_id, c.candidate_name, c.party_or_group ORDER BY total_votes DESC`,
        results: db.prepare(`SELECT c.candidate_id, c.candidate_name, c.party_or_group, COUNT(v.vote_id) AS total_votes FROM candidates c LEFT JOIN votes v ON c.candidate_id = v.candidate_id AND c.election_id = v.election_id WHERE c.election_id = 1 GROUP BY c.candidate_id, c.candidate_name, c.party_or_group ORDER BY total_votes DESC`).all(),
      },
      {
        title: 'Query E: Display Blockchain Ledger Blocks',
        sql: `SELECT block_index, previous_hash, current_hash, transaction_hash, created_at FROM blockchain_blocks WHERE election_id = 1 ORDER BY block_index ASC`,
        results: db.prepare(`SELECT block_index, previous_hash, current_hash, transaction_hash, created_at FROM blockchain_blocks WHERE election_id = 1 ORDER BY block_index ASC`).all(),
      },
      {
        title: 'Query F: Relational Join with Users & Audit Logs',
        sql: `SELECT a.log_id, a.action_type, a.entity_type, u.full_name AS actor_name, u.role AS actor_role, a.created_at FROM audit_logs a LEFT JOIN users u ON a.actor_user_id = u.user_id ORDER BY a.log_id DESC LIMIT 10`,
        results: db.prepare(`SELECT a.log_id, a.action_type, a.entity_type, u.full_name AS actor_name, u.role AS actor_role, a.created_at FROM audit_logs a LEFT JOIN users u ON a.actor_user_id = u.user_id ORDER BY a.log_id DESC LIMIT 10`).all(),
      },
      {
        title: 'View Demonstration: view_election_turnout',
        sql: `SELECT * FROM view_election_turnout`,
        results: db.prepare(`SELECT * FROM view_election_turnout`).all(),
      },
    ];

    return res.json({ queries });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'SQL demonstration failed.' });
  }
}

export function exportCsv(req, res) {
  try {
    const electionId = Number(req.params.electionId);
    const standings = db.prepare('SELECT * FROM view_candidate_vote_totals WHERE election_id = ? ORDER BY total_votes DESC').all(electionId);

    let csv = 'Candidate ID,Election ID,Candidate Name,Party,Total Votes\n';
    for (const row of standings) {
      csv += `"${row.candidate_id}","${row.election_id}","${row.candidate_name}","${row.party_or_group}","${row.total_votes}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="election_${electionId}_results.csv"`);
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to export CSV.' });
  }
}
