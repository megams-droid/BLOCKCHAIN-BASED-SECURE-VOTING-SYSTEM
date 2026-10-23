import { db } from '../config/db.js';
import { verifyBlockchain, simulateTamper, restoreBlock } from '../services/blockchain.js';
import { logAudit } from '../services/audit.js';

export function getBlockchain(req, res) {
  try {
    const electionId = Number(req.params.electionId);

    const election = db.prepare('SELECT election_id, election_name FROM elections WHERE election_id = ?').get(electionId);
    if (!election) return res.status(404).json({ error: 'Election not found.' });

    // Core DBMS Syllabus Query E: Display blockchain records
    const blocks = db.prepare(`
      SELECT 
        block_id,
        election_id,
        block_index,
        previous_hash,
        current_hash,
        transaction_hash,
        created_at
      FROM blockchain_blocks
      WHERE election_id = ?
      ORDER BY block_index ASC
    `).all(electionId);

    return res.json({
      election,
      total_blocks: blocks.length,
      blocks,
    });
  } catch (error) {
    console.error('getBlockchain error:', error);
    return res.status(500).json({ error: 'Failed to retrieve blockchain records.' });
  }
}

export function verifyChain(req, res) {
  try {
    const electionId = Number(req.params.electionId);

    const election = db.prepare('SELECT election_id, election_name FROM elections WHERE election_id = ?').get(electionId);
    if (!election) return res.status(404).json({ error: 'Election not found.' });

    const verificationResult = verifyBlockchain(electionId);

    logAudit({
      actor_user_id: req.user?.user_id || null,
      action_type: 'BLOCKCHAIN_VERIFICATION',
      entity_type: 'BLOCKCHAIN',
      entity_reference: String(electionId),
      details: { status: verificationResult.status, isValid: verificationResult.isValid },
    });

    return res.json({
      election,
      ...verificationResult,
    });
  } catch (error) {
    console.error('verifyChain error:', error);
    return res.status(500).json({ error: 'Blockchain verification process failed.' });
  }
}

export function tamperBlock(req, res) {
  try {
    const electionId = Number(req.params.electionId);
    const { block_id, forged_hash } = req.body;

    if (!block_id) {
      return res.status(400).json({ error: 'block_id is required.' });
    }

    const result = simulateTamper(electionId, block_id, forged_hash);

    logAudit({
      actor_user_id: req.user?.user_id || null,
      action_type: 'TAMPER_SIMULATION_TRIGGERED',
      entity_type: 'BLOCKCHAIN_BLOCK',
      entity_reference: String(block_id),
      details: 'Simulated unauthorized database modification to demonstrate integrity verification',
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Tamper simulation failed.' });
  }
}

export function restoreChainBlock(req, res) {
  try {
    const electionId = Number(req.params.electionId);
    const { block_id } = req.body;

    if (!block_id) {
      return res.status(400).json({ error: 'block_id is required.' });
    }

    const result = restoreBlock(electionId, block_id);

    logAudit({
      actor_user_id: req.user?.user_id || null,
      action_type: 'BLOCK_RESTORED',
      entity_type: 'BLOCKCHAIN_BLOCK',
      entity_reference: String(block_id),
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Block restore failed.' });
  }
}
