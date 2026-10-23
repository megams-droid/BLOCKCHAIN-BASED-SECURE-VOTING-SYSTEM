import crypto from 'crypto';
import { db } from '../config/db.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes canonical deterministic SHA-256 hash for a block
 */
export function calculateBlockHash({ election_id, block_index, previous_hash, transaction_hash, created_at }) {
  const canonicalString = `${election_id}|${block_index}|${previous_hash}|${transaction_hash}|${created_at}`;
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

/**
 * Computes a cryptographic hash for a transaction ballot
 */
export function calculateTransactionHash({ election_id, candidate_id, anonymous_reference, timestamp }) {
  const payload = `${election_id}:${candidate_id}:${anonymous_reference}:${timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Creates Genesis Block for an election
 */
export function initializeElectionGenesisBlock(election_id, created_at = new Date().toISOString()) {
  const existingGenesis = db.prepare(`
    SELECT * FROM blockchain_blocks WHERE election_id = ? AND block_index = 0
  `).get(election_id);

  if (existingGenesis) return existingGenesis;

  const transaction_hash = crypto
    .createHash('sha256')
    .update(`GENESIS_ELECTION_INIT_${election_id}_${created_at}`)
    .digest('hex');

  const current_hash = calculateBlockHash({
    election_id,
    block_index: 0,
    previous_hash: GENESIS_HASH,
    transaction_hash,
    created_at,
  });

  const stmt = db.prepare(`
    INSERT INTO blockchain_blocks (election_id, block_index, previous_hash, current_hash, transaction_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(election_id, 0, GENESIS_HASH, current_hash, transaction_hash, created_at);
  return {
    block_id: info.lastInsertRowid,
    election_id,
    block_index: 0,
    previous_hash: GENESIS_HASH,
    current_hash,
    transaction_hash,
    created_at,
  };
}

/**
 * Mines / creates a new block linked to the previous block
 * Must be executed inside the caller's transaction
 */
export function createLedgerBlock({ election_id, transaction_hash, timestamp }) {
  const createdAt = timestamp || new Date().toISOString();

  // Get the latest block for this election
  const latestBlock = db.prepare(`
    SELECT * FROM blockchain_blocks 
    WHERE election_id = ? 
    ORDER BY block_index DESC 
    LIMIT 1
  `).get(election_id);

  let block_index = 1;
  let previous_hash = GENESIS_HASH;

  if (latestBlock) {
    block_index = latestBlock.block_index + 1;
    previous_hash = latestBlock.current_hash;
  } else {
    // If no genesis exists, initialize one
    const genesis = initializeElectionGenesisBlock(election_id);
    block_index = 1;
    previous_hash = genesis.current_hash;
  }

  const current_hash = calculateBlockHash({
    election_id,
    block_index,
    previous_hash,
    transaction_hash,
    created_at: createdAt,
  });

  const stmt = db.prepare(`
    INSERT INTO blockchain_blocks (election_id, block_index, previous_hash, current_hash, transaction_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(election_id, block_index, previous_hash, current_hash, transaction_hash, createdAt);

  return {
    block_id: info.lastInsertRowid,
    election_id,
    block_index,
    previous_hash,
    current_hash,
    transaction_hash,
    created_at: createdAt,
  };
}

/**
 * Verifies the complete blockchain integrity for an election
 */
export function verifyBlockchain(election_id) {
  const blocks = db.prepare(`
    SELECT * FROM blockchain_blocks
    WHERE election_id = ?
    ORDER BY block_index ASC
  `).all(election_id);

  if (blocks.length === 0) {
    return {
      isValid: false,
      status: 'No blockchain ledger records found for this election',
      totalBlocks: 0,
      issues: ['No blocks recorded'],
      blocks: [],
    };
  }

  const issues = [];
  let chainValid = true;

  // Check 1: Genesis block verification
  const genesis = blocks[0];
  if (genesis.block_index !== 0) {
    issues.push(`Block 0 missing. First block starts at index ${genesis.block_index}.`);
    chainValid = false;
  }
  if (genesis.previous_hash !== GENESIS_HASH) {
    issues.push(`Genesis block previous_hash must be 64 zeros, found: ${genesis.previous_hash}`);
    chainValid = false;
  }

  // Recalculate genesis hash
  const recalculatedGenesisHash = calculateBlockHash({
    election_id: genesis.election_id,
    block_index: genesis.block_index,
    previous_hash: genesis.previous_hash,
    transaction_hash: genesis.transaction_hash,
    created_at: genesis.created_at,
  });

  if (recalculatedGenesisHash !== genesis.current_hash) {
    issues.push(`Genesis block hash tampering detected! Stored: ${genesis.current_hash}, Computed: ${recalculatedGenesisHash}`);
    chainValid = false;
  }

  // Check 2: Sequential verification of subsequent blocks
  for (let i = 1; i < blocks.length; i++) {
    const prevBlock = blocks[i - 1];
    const currBlock = blocks[i];

    // Continuity check
    if (currBlock.block_index !== prevBlock.block_index + 1) {
      issues.push(`Invalid block index continuity: expected #${prevBlock.block_index + 1}, found #${currBlock.block_index}`);
      chainValid = false;
    }

    // Previous hash link check
    if (currBlock.previous_hash !== prevBlock.current_hash) {
      issues.push(
        `Previous-hash mismatch at Block #${currBlock.block_index}: previous_hash (${currBlock.previous_hash.slice(0, 16)}...) != preceding block current_hash (${prevBlock.current_hash.slice(0, 16)}...)`
      );
      chainValid = false;
    }

    // Recalculate current hash
    const recomputedHash = calculateBlockHash({
      election_id: currBlock.election_id,
      block_index: currBlock.block_index,
      previous_hash: currBlock.previous_hash,
      transaction_hash: currBlock.transaction_hash,
      created_at: currBlock.created_at,
    });

    if (recomputedHash !== currBlock.current_hash) {
      issues.push(
        `Cryptographic hash mismatch at Block #${currBlock.block_index}! Stored hash (${currBlock.current_hash.slice(0, 16)}...) does not match canonical recomputed hash (${recomputedHash.slice(0, 16)}...). Data has been tampered with.`
      );
      chainValid = false;
    }
  }

  // Check 3: Check votes table consistency
  const totalVotes = db.prepare(`SELECT COUNT(*) as count FROM votes WHERE election_id = ?`).get(election_id).count;
  const nonGenesisBlocks = blocks.filter((b) => b.block_index > 0).length;

  if (totalVotes !== nonGenesisBlocks) {
    issues.push(`Ledger consistency mismatch: recorded ballot count (${totalVotes}) does not match non-genesis block count (${nonGenesisBlocks}).`);
    chainValid = false;
  }

  let status = 'Ledger integrity verified';
  if (!chainValid) {
    if (issues.some((e) => e.includes('continuity') || e.includes('index'))) {
      status = 'Invalid block index';
    } else if (issues.some((e) => e.includes('Previous-hash mismatch'))) {
      status = 'Previous-hash mismatch';
    } else {
      status = 'Integrity verification failed';
    }
  }

  return {
    isValid: chainValid,
    status,
    totalBlocks: blocks.length,
    voteCount: totalVotes,
    verifiedAt: new Date().toISOString(),
    issues,
    blocks,
  };
}

/**
 * Simulates deliberate ledger tampering for college DBMS demonstrations
 */
export function simulateTamper(election_id, block_id, forged_hash) {
  const block = db.prepare('SELECT * FROM blockchain_blocks WHERE block_id = ? AND election_id = ?').get(block_id, election_id);
  if (!block) throw new Error('Block not found');

  const altered = forged_hash || 'deadbeef' + '0'.repeat(56);
  db.prepare('UPDATE blockchain_blocks SET current_hash = ? WHERE block_id = ?').run(altered, block_id);

  return {
    message: `Block #${block.block_index} current_hash altered to ${altered}. Verify blockchain to observe tamper detection.`,
    block_index: block.block_index,
    original_hash: block.current_hash,
    forged_hash: altered,
  };
}

/**
 * Restores the true hash of a block
 */
export function restoreBlock(election_id, block_id) {
  const block = db.prepare('SELECT * FROM blockchain_blocks WHERE block_id = ? AND election_id = ?').get(block_id, election_id);
  if (!block) throw new Error('Block not found');

  const trueHash = calculateBlockHash({
    election_id: block.election_id,
    block_index: block.block_index,
    previous_hash: block.previous_hash,
    transaction_hash: block.transaction_hash,
    created_at: block.created_at,
  });

  db.prepare('UPDATE blockchain_blocks SET current_hash = ? WHERE block_id = ?').run(trueHash, block_id);
  return { message: `Block #${block.block_index} restored to valid cryptographic hash.`, trueHash };
}
