import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path in the project database/ folder
const dbDir = path.resolve(__dirname, '../../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'secure_voting.sqlite');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability and concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize schema and views
export function initDatabase() {
  const schemaPath = path.join(dbDir, 'schema.sql');
  const viewsPath = path.join(dbDir, 'views.sql');

  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  if (fs.existsSync(viewsPath)) {
    const viewsSql = fs.readFileSync(viewsPath, 'utf8');
    db.exec(viewsSql);
  }

  seedInitialData();
}

// Seed default users, elections, candidates and voter eligibility if empty
function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  console.log('🌱 Seeding initial DBMS records...');

  const passwordHash = bcrypt.hashSync('Password@123', 10);

  // 1. Seed Users (Admin, Candidates, Voters)
  const insertUser = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, voter_reference, account_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const admin = insertUser.run(
    'Chief Election Officer (Admin)',
    'admin@voting.gov',
    passwordHash,
    'admin',
    'VOT-ADMIN-001',
    'active'
  );

  const candUser1 = insertUser.run(
    'Dr. Elena Vance',
    'elena.vance@campus.edu',
    passwordHash,
    'candidate',
    'VOT-CAND-001',
    'active'
  );

  const candUser2 = insertUser.run(
    'Marcus Sterling',
    'marcus.s@campus.edu',
    passwordHash,
    'candidate',
    'VOT-CAND-002',
    'active'
  );

  const candUser3 = insertUser.run(
    'Aaliyah Patel',
    'aaliyah.p@campus.edu',
    passwordHash,
    'candidate',
    'VOT-CAND-003',
    'active'
  );

  const voter1 = insertUser.run(
    'Alex Rivera (Voter)',
    'alex.voter@campus.edu',
    passwordHash,
    'voter',
    'VOT-2026-8819',
    'active'
  );

  const voter2 = insertUser.run(
    'Jordan Lee (Voter)',
    'jordan.voter@campus.edu',
    passwordHash,
    'voter',
    'VOT-2026-9023',
    'active'
  );

  const voter3 = insertUser.run(
    'Samira Khan (Voter)',
    'samira.voter@campus.edu',
    passwordHash,
    'voter',
    'VOT-2026-7734',
    'active'
  );

  const voter4 = insertUser.run(
    'Liam Chen (Voter)',
    'liam.voter@campus.edu',
    passwordHash,
    'voter',
    'VOT-2026-5541',
    'active'
  );

  // 2. Seed Elections
  const insertElection = db.prepare(`
    INSERT INTO elections (election_name, description, start_time, end_time, election_status, results_published, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const tomorrow = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
  const pastStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const pastEnd = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString();

  // Active election
  const el1 = insertElection.run(
    '2026 University Student Council Presidential Election',
    'Annual democratic election to elect the Student Council President representing 15,000+ collegiate scholars.',
    yesterday,
    tomorrow,
    'active',
    0,
    admin.lastInsertRowid
  );

  // Completed & published election
  const el2 = insertElection.run(
    'Department of Computer Science Representative 2026',
    'Official faculty and student representative election for computer science and cybersecurity research labs.',
    pastStart,
    pastEnd,
    'closed',
    1,
    admin.lastInsertRowid
  );

  // 3. Seed Candidates
  const insertCandidate = db.prepare(`
    INSERT INTO candidates (user_id, election_id, candidate_name, party_or_group, manifesto)
    VALUES (?, ?, ?, ?, ?)
  `);

  const c1 = insertCandidate.run(
    candUser1.lastInsertRowid,
    el1.lastInsertRowid,
    'Dr. Elena Vance',
    'Digital Transformation Alliance',
    'Advancing open educational resources, 24/7 library computing access, and transparent student representation with cryptographic auditing.'
  );

  const c2 = insertCandidate.run(
    candUser2.lastInsertRowid,
    el1.lastInsertRowid,
    'Marcus Sterling',
    'Progressive Campus Union',
    'Zero-carbon sustainability on campus, subsidized healthy dining, and enhanced mental health resource funding.'
  );

  const c3 = insertCandidate.run(
    candUser3.lastInsertRowid,
    el1.lastInsertRowid,
    'Aaliyah Patel',
    'Innovation & Ethics Caucus',
    'Fostering collegiate AI research ethics, cross-disciplinary laboratory grants, and modern student governance.'
  );

  // Candidate for election 2
  insertCandidate.run(
    candUser1.lastInsertRowid,
    el2.lastInsertRowid,
    'Dr. Elena Vance',
    'CS Ethics & Robotics',
    'Representing peer interests in GPU cluster allocation and curriculum evolution.'
  );

  insertCandidate.run(
    candUser2.lastInsertRowid,
    el2.lastInsertRowid,
    'Marcus Sterling',
    'Open Source Systems',
    'Expanding student developer hackathons and industry internship bridges.'
  );

  // 4. Seed Genesis Block for Election 1 using canonical hash function
  const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
  const insertBlock = db.prepare(`
    INSERT INTO blockchain_blocks (election_id, block_index, previous_hash, current_hash, transaction_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const txHash1 = crypto.createHash('sha256').update(`GENESIS_TX_ELECTION_INIT_${el1.lastInsertRowid}_${yesterday}`).digest('hex');
  const canonicalGenesis1Hash = crypto.createHash('sha256')
    .update(`${el1.lastInsertRowid}|0|${GENESIS_HASH}|${txHash1}|${yesterday}`)
    .digest('hex');

  const genesisBlock1 = insertBlock.run(
    el1.lastInsertRowid,
    0,
    GENESIS_HASH,
    canonicalGenesis1Hash,
    txHash1,
    yesterday
  );

  // Genesis block for Election 2
  const txHash2 = crypto.createHash('sha256').update(`GENESIS_TX_CS_REP_INIT_${el2.lastInsertRowid}_${pastStart}`).digest('hex');
  const canonicalGenesis2Hash = crypto.createHash('sha256')
    .update(`${el2.lastInsertRowid}|0|${GENESIS_HASH}|${txHash2}|${pastStart}`)
    .digest('hex');

  const genesisBlock2 = insertBlock.run(
    el2.lastInsertRowid,
    0,
    GENESIS_HASH,
    canonicalGenesis2Hash,
    txHash2,
    pastStart
  );

  // 5. Voter Eligibility
  const insertEligibility = db.prepare(`
    INSERT INTO voter_eligibility (voter_id, election_id, is_eligible, has_voted)
    VALUES (?, ?, ?, ?)
  `);

  // Election 1 eligibility
  insertEligibility.run(voter1.lastInsertRowid, el1.lastInsertRowid, 1, 0);
  insertEligibility.run(voter2.lastInsertRowid, el1.lastInsertRowid, 1, 0);
  insertEligibility.run(voter3.lastInsertRowid, el1.lastInsertRowid, 1, 0);
  insertEligibility.run(voter4.lastInsertRowid, el1.lastInsertRowid, 1, 0);

  // Election 2 eligibility (pre-completed votes for demo)
  insertEligibility.run(voter1.lastInsertRowid, el2.lastInsertRowid, 1, 1);
  insertEligibility.run(voter2.lastInsertRowid, el2.lastInsertRowid, 1, 1);
  insertEligibility.run(voter3.lastInsertRowid, el2.lastInsertRowid, 1, 1);

  // Seed sample votes and authentic blocks for completed election 2
  const txBallot1 = crypto.createHash('sha256').update(`${el2.lastInsertRowid}:${candUser1.lastInsertRowid}:BALLOT_SEC_1:${pastStart}`).digest('hex');
  const hashB1 = crypto.createHash('sha256').update(`${el2.lastInsertRowid}|1|${canonicalGenesis2Hash}|${txBallot1}|${pastStart}`).digest('hex');
  const b1 = insertBlock.run(el2.lastInsertRowid, 1, canonicalGenesis2Hash, hashB1, txBallot1, pastStart);
  db.prepare(`
    INSERT INTO votes (election_id, candidate_id, encrypted_or_protected_vote_reference, cast_at, block_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(el2.lastInsertRowid, candUser1.lastInsertRowid, 'BALLOT_HASH_SEC_1', pastStart, b1.lastInsertRowid);

  const txBallot2 = crypto.createHash('sha256').update(`${el2.lastInsertRowid}:${candUser1.lastInsertRowid}:BALLOT_SEC_2:${pastStart}`).digest('hex');
  const hashB2 = crypto.createHash('sha256').update(`${el2.lastInsertRowid}|2|${hashB1}|${txBallot2}|${pastStart}`).digest('hex');
  const b2 = insertBlock.run(el2.lastInsertRowid, 2, hashB1, hashB2, txBallot2, pastStart);
  db.prepare(`
    INSERT INTO votes (election_id, candidate_id, encrypted_or_protected_vote_reference, cast_at, block_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(el2.lastInsertRowid, candUser1.lastInsertRowid, 'BALLOT_HASH_SEC_2', pastStart, b2.lastInsertRowid);

  const txBallot3 = crypto.createHash('sha256').update(`${el2.lastInsertRowid}:${candUser2.lastInsertRowid}:BALLOT_SEC_3:${pastEnd}`).digest('hex');
  const hashB3 = crypto.createHash('sha256').update(`${el2.lastInsertRowid}|3|${hashB2}|${txBallot3}|${pastEnd}`).digest('hex');
  const b3 = insertBlock.run(el2.lastInsertRowid, 3, hashB2, hashB3, txBallot3, pastEnd);
  db.prepare(`
    INSERT INTO votes (election_id, candidate_id, encrypted_or_protected_vote_reference, cast_at, block_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(el2.lastInsertRowid, candUser2.lastInsertRowid, 'BALLOT_HASH_SEC_3', pastEnd, b3.lastInsertRowid);

  // Seed audit log
  db.prepare(`
    INSERT INTO audit_logs (actor_user_id, action_type, entity_type, entity_reference, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    admin.lastInsertRowid,
    'SYSTEM_INITIALIZATION',
    'DATABASE',
    'secure_voting_db',
    'Initial system seed performed with 3NF relational schemas, genesis blocks, and sample elections.'
  );

  console.log('✅ Seeding completed successfully!');
}
