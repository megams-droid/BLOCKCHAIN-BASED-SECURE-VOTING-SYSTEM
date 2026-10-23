import crypto from 'crypto';
import { db } from '../config/db.js';
import { createLedgerBlock, calculateTransactionHash } from '../services/blockchain.js';
import { logAudit } from '../services/audit.js';

const ANONYMIZATION_SALT = process.env.VOTE_SALT || 'antigravity_anonymity_salt_blockchain_2026';

export function getEligibility(req, res) {
  try {
    const electionId = Number(req.params.electionId);
    const voterId = req.user.user_id;

    const election = db.prepare('SELECT election_id, election_name, election_status, start_time, end_time FROM elections WHERE election_id = ?').get(electionId);
    if (!election) return res.status(404).json({ error: 'Election not found.' });

    const eligibility = db.prepare(`
      SELECT is_eligible, has_voted, voted_at
      FROM voter_eligibility
      WHERE election_id = ? AND voter_id = ?
    `).get(electionId, voterId);

    return res.json({
      election,
      is_eligible: eligibility ? Boolean(eligibility.is_eligible) : false,
      has_voted: eligibility ? Boolean(eligibility.has_voted) : false,
      voted_at: eligibility?.voted_at || null,
    });
  } catch (error) {
    console.error('getEligibility error:', error);
    return res.status(500).json({ error: 'Failed to check voter eligibility.' });
  }
}

export function castVote(req, res) {
  try {
    const { election_id, candidate_id } = req.body;
    const voterId = req.user.user_id;

    if (!election_id || !candidate_id) {
      return res.status(400).json({ error: 'Election ID and Candidate ID are required.' });
    }

    // 1. Validate Election Status
    const election = db.prepare('SELECT * FROM elections WHERE election_id = ?').get(election_id);
    if (!election) {
      return res.status(404).json({ error: 'Election does not exist.' });
    }

    if (election.election_status !== 'active') {
      return res.status(400).json({
        error: `Cannot cast vote: Election is currently '${election.election_status}'. Voting is only permitted when 'active'.`,
      });
    }

    // Check timeframe if dates configured
    const now = new Date();
    if (new Date(election.end_time) < now) {
      return res.status(400).json({ error: 'Election period has ended.' });
    }

    // 2. Validate Candidate belongs to Election
    const candidate = db.prepare(`
      SELECT candidate_id, candidate_name, party_or_group
      FROM candidates
      WHERE candidate_id = ? AND election_id = ?
    `).get(candidate_id, election_id);

    if (!candidate) {
      return res.status(400).json({ error: 'Selected candidate is not registered for this election.' });
    }

    // 3. ATOMIC DATABASE TRANSACTION FOR VOTE CASTING & BLOCKCHAIN LEDGER PERSISTENCE
    // Ensures ACID guarantees (All or Nothing)
    const executeVoteTransaction = db.transaction(() => {
      // Re-check voter eligibility inside transaction to prevent race conditions & double-voting
      const eligibility = db.prepare(`
        SELECT eligibility_id, is_eligible, has_voted 
        FROM voter_eligibility 
        WHERE election_id = ? AND voter_id = ?
      `).get(election_id, voterId);

      if (!eligibility || eligibility.is_eligible !== 1) {
        throw new Error('UNAUTHORIZED_VOTER: You are not authorized or eligible to vote in this election.');
      }

      if (eligibility.has_voted === 1) {
        throw new Error('DUPLICATE_VOTE: Duplicate voting rejected. You have already cast your ballot in this election.');
      }

      const timestamp = new Date().toISOString();

      // Compute one-way cryptographic anonymous voter token
      const anonymous_reference = crypto
        .createHash('sha256')
        .update(`${voterId}:${election_id}:${ANONYMIZATION_SALT}`)
        .digest('hex');

      // Compute transaction hash for the ballot
      const transaction_hash = calculateTransactionHash({
        election_id,
        candidate_id,
        anonymous_reference,
        timestamp,
      });

      // Insert into Blockchain Ledger
      const newBlock = createLedgerBlock({
        election_id,
        transaction_hash,
        timestamp,
      });

      // Persist anonymous ballot into votes table linked to the block
      const voteStmt = db.prepare(`
        INSERT INTO votes (election_id, candidate_id, encrypted_or_protected_vote_reference, cast_at, block_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      const voteResult = voteStmt.run(election_id, candidate_id, anonymous_reference, timestamp, newBlock.block_id);

      // Mark voter participation in voter_eligibility (separated from ballot candidate choice)
      const updateEligibilityStmt = db.prepare(`
        UPDATE voter_eligibility
        SET has_voted = 1, voted_at = ?
        WHERE election_id = ? AND voter_id = ? AND has_voted = 0
      `);
      const updateResult = updateEligibilityStmt.run(timestamp, election_id, voterId);

      if (updateResult.changes !== 1) {
        throw new Error('CONCURRENCY_ERROR: Vote could not be recorded due to simultaneous attempt.');
      }

      return {
        voteId: voteResult.lastInsertRowid,
        block: newBlock,
        timestamp,
      };
    });

    const result = executeVoteTransaction();

    // Log audit trail (preserving ballot anonymity - do NOT record candidate choice)
    logAudit({
      actor_user_id: voterId,
      action_type: 'VOTE_CAST',
      entity_type: 'ELECTION',
      entity_reference: String(election_id),
      details: {
        block_index: result.block.block_index,
        block_hash: result.block.current_hash,
      },
    });

    return res.status(201).json({
      message: 'Vote cast successfully and permanently recorded in the blockchain ledger!',
      receipt: {
        election_id,
        election_name: election.election_name,
        block_index: result.block.block_index,
        current_hash: result.block.current_hash,
        previous_hash: result.block.previous_hash,
        transaction_hash: result.block.transaction_hash,
        timestamp: result.timestamp,
        verification_status: 'CONFIRMED_ON_LEDGER',
      },
    });
  } catch (error) {
    if (error.message.startsWith('DUPLICATE_VOTE') || error.message.startsWith('UNAUTHORIZED_VOTER')) {
      return res.status(403).json({ error: error.message });
    }
    console.error('castVote error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process vote.' });
  }
}

export function getParticipation(req, res) {
  try {
    const electionId = Number(req.params.electionId);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_eligible,
        SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) as total_voted
      FROM voter_eligibility
      WHERE election_id = ? AND is_eligible = 1
    `).get(electionId);

    const totalEligible = stats.total_eligible || 0;
    const totalVoted = stats.total_voted || 0;
    const turnout = totalEligible > 0 ? Number(((totalVoted / totalEligible) * 100).toFixed(2)) : 0;

    return res.json({
      election_id: electionId,
      eligible_voters: totalEligible,
      voters_participated: totalVoted,
      turnout_percentage: turnout,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve participation statistics.' });
  }
}
