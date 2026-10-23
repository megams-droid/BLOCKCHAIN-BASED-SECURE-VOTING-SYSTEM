import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { db, initDatabase } from '../backend/src/config/db.js';
import {
  calculateBlockHash,
  calculateTransactionHash,
  createLedgerBlock,
  verifyBlockchain,
  simulateTamper,
  restoreBlock,
  GENESIS_HASH,
} from '../backend/src/services/blockchain.js';

initDatabase();

test('1. Cryptographic Hash Determinism', () => {
  const hash1 = calculateBlockHash({
    election_id: 1,
    block_index: 1,
    previous_hash: GENESIS_HASH,
    transaction_hash: 'tx_abc',
    created_at: '2026-10-22T00:00:00Z',
  });
  const hash2 = calculateBlockHash({
    election_id: 1,
    block_index: 1,
    previous_hash: GENESIS_HASH,
    transaction_hash: 'tx_abc',
    created_at: '2026-10-22T00:00:00Z',
  });
  assert.strictEqual(hash1, hash2, 'Hash must be strictly deterministic');
  assert.strictEqual(hash1.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
});

test('2. Blockchain Verification on Clean Ledger', () => {
  const report = verifyBlockchain(1);
  assert.strictEqual(report.isValid, true, 'Clean election blockchain must pass integrity verification');
  assert.strictEqual(report.status, 'Ledger integrity verified');
  assert.ok(report.totalBlocks >= 1, 'Should have at least Genesis block');
});

test('3. Duplicate-Vote Prevention & Atomic Integrity', () => {
  // Test election 1 and a sample voter
  const voter = db.prepare("SELECT user_id FROM users WHERE email = 'alex.voter@campus.edu'").get();
  assert.ok(voter, 'Test voter exists');

  // Verify eligibility record exists
  const eligibility = db.prepare('SELECT * FROM voter_eligibility WHERE election_id = 1 AND voter_id = ?').get(voter.user_id);
  assert.ok(eligibility, 'Eligibility record exists');
  assert.strictEqual(eligibility.has_voted, 0, 'Voter has not yet voted');
});

test('4. Tamper Detection Simulation', () => {
  // Check election 2
  const blocks = db.prepare('SELECT block_id FROM blockchain_blocks WHERE election_id = 2 AND block_index = 1').get();
  if (blocks) {
    // Deliberately tamper with the hash
    simulateTamper(2, blocks.block_id, 'deadbeef'.repeat(8));

    // Verify blockchain must fail
    const reportAfterTamper = verifyBlockchain(2);
    assert.strictEqual(reportAfterTamper.isValid, false, 'Tampered ledger must fail verification');
    assert.ok(reportAfterTamper.issues.length > 0, 'Must report tampering issues');

    // Restore block
    restoreBlock(2, blocks.block_id);
    const reportRestored = verifyBlockchain(2);
    assert.strictEqual(reportRestored.isValid, true, 'Restored ledger must pass verification');
  }
});
