-- ========================================================
-- BLOCKCHAIN-BASED SECURE VOTING SYSTEM (DBMS PROJECT)
-- Database Name: secure_voting_db
-- Relational Schema with 3NF Normalization, Constraints & Indexes
-- ========================================================

-- Enable Foreign Keys (for SQLite & relational engines)
PRAGMA foreign_keys = ON;

-- Table 1: Users
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('voter', 'candidate', 'admin')),
    voter_reference VARCHAR(64) UNIQUE,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Table 2: Elections
CREATE TABLE IF NOT EXISTS elections (
    election_id INTEGER PRIMARY KEY AUTOINCREMENT,
    election_name VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    election_status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (election_status IN ('upcoming', 'active', 'closed')),
    results_published INTEGER NOT NULL DEFAULT 0 CHECK (results_published IN (0, 1)),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(election_status);

-- Table 3: Candidates
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    election_id INTEGER NOT NULL,
    candidate_name VARCHAR(150) NOT NULL,
    party_or_group VARCHAR(150) NOT NULL,
    manifesto TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE,
    CONSTRAINT uq_candidate_election UNIQUE (user_id, election_id)
);

CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates(election_id);

-- Table 4: Voter Eligibility & Participation Tracking
CREATE TABLE IF NOT EXISTS voter_eligibility (
    eligibility_id INTEGER PRIMARY KEY AUTOINCREMENT,
    voter_id INTEGER NOT NULL,
    election_id INTEGER NOT NULL,
    is_eligible INTEGER NOT NULL DEFAULT 1 CHECK (is_eligible IN (0, 1)),
    has_voted INTEGER NOT NULL DEFAULT 0 CHECK (has_voted IN (0, 1)),
    voted_at TIMESTAMP,
    FOREIGN KEY (voter_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE,
    CONSTRAINT uq_voter_election UNIQUE (voter_id, election_id)
);

CREATE INDEX IF NOT EXISTS idx_eligibility_lookup ON voter_eligibility(voter_id, election_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_election ON voter_eligibility(election_id);

-- Table 6: Blockchain Blocks (Created before Votes for foreign key reference)
CREATE TABLE IF NOT EXISTS blockchain_blocks (
    block_id INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id INTEGER NOT NULL,
    block_index INTEGER NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    transaction_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE,
    CONSTRAINT uq_block_election_index UNIQUE (election_id, block_index)
);

CREATE INDEX IF NOT EXISTS idx_blocks_election ON blockchain_blocks(election_id);

-- Table 5: Votes (Ballot records separated from voter identity for anonymity)
CREATE TABLE IF NOT EXISTS votes (
    vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    encrypted_or_protected_vote_reference VARCHAR(64) NOT NULL,
    cast_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    block_id INTEGER,
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE RESTRICT,
    FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE RESTRICT,
    FOREIGN KEY (block_id) REFERENCES blockchain_blocks(block_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_votes_election ON votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);

-- Table 7: Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER,
    action_type VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_reference VARCHAR(120),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
