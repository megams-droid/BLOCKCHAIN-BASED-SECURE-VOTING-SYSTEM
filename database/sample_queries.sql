-- ========================================================
-- BLOCKCHAIN-BASED SECURE VOTING SYSTEM
-- Core DBMS Syllabus Demonstration SQL Queries
-- ========================================================

-- A. Display candidates for an election (Parameterized)
SELECT candidate_id, candidate_name, party_or_group, manifesto
FROM candidates
WHERE election_id = 1
ORDER BY candidate_name ASC;

-- B. Count eligible voters per election (GROUP BY & Aggregate)
SELECT election_id, COUNT(*) AS eligible_voters
FROM voter_eligibility
WHERE is_eligible = 1
GROUP BY election_id;

-- C. Calculate turnout (COUNT, SUM, CASE conditional aggregation)
SELECT 
    election_id,
    COUNT(*) AS eligible_voters,
    SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS voters_participated,
    ROUND((CAST(SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS REAL) * 100.0) / COUNT(*), 2) AS turnout_rate
FROM voter_eligibility
WHERE is_eligible = 1
GROUP BY election_id;

-- D. Calculate candidate totals with LEFT JOIN
SELECT 
    c.candidate_id, 
    c.candidate_name,
    c.party_or_group,
    COUNT(v.vote_id) AS total_votes
FROM candidates c
LEFT JOIN votes v ON c.candidate_id = v.candidate_id
WHERE c.election_id = 1
GROUP BY c.candidate_id, c.candidate_name, c.party_or_group
ORDER BY total_votes DESC;

-- E. Display blockchain ledger records (Ordering by index)
SELECT 
    block_index, 
    previous_hash,
    current_hash, 
    transaction_hash,
    created_at
FROM blockchain_blocks
WHERE election_id = 1
ORDER BY block_index ASC;

-- F. Relational Joins: Audit Logs with Actor details
SELECT 
    a.log_id,
    a.action_type,
    a.entity_type,
    a.entity_reference,
    a.details,
    u.full_name AS actor_name,
    u.role AS actor_role,
    a.created_at
FROM audit_logs a
LEFT JOIN users u ON a.actor_user_id = u.user_id
ORDER BY a.created_at DESC
LIMIT 20;

-- G. Subquery demonstration: Find voters who have not yet voted in any active election
SELECT user_id, full_name, email
FROM users
WHERE role = 'voter' 
  AND user_id IN (
      SELECT voter_id 
      FROM voter_eligibility 
      WHERE is_eligible = 1 AND has_voted = 0
  );

-- H. HAVING clause demonstration: Elections with turnout higher than average or with >= 2 votes
SELECT 
    e.election_name,
    COUNT(v.vote_id) AS total_votes
FROM elections e
JOIN votes v ON e.election_id = v.election_id
GROUP BY e.election_id, e.election_name
HAVING COUNT(v.vote_id) >= 1;

-- I. Transaction demonstration (Atomic Vote Casting & Ledger Entry)
-- BEGIN TRANSACTION;
-- UPDATE voter_eligibility SET has_voted = 1, voted_at = CURRENT_TIMESTAMP WHERE voter_id = 2 AND election_id = 1;
-- INSERT INTO blockchain_blocks (election_id, block_index, previous_hash, current_hash, transaction_hash) VALUES (1, 1, 'GENESIS_HASH', '...', '...');
-- INSERT INTO votes (election_id, candidate_id, encrypted_or_protected_vote_reference, block_id) VALUES (1, 1, '...', last_insert_rowid());
-- COMMIT; -- or ROLLBACK on failure!
