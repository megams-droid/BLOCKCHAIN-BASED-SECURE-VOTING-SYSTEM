-- ========================================================
-- BLOCKCHAIN-BASED SECURE VOTING SYSTEM (DBMS VIEWS)
-- ========================================================

-- View 1: Election Turnout Summary
-- Demonstrates aggregation, LEFT JOIN, CASE expressions, and percentages
CREATE VIEW IF NOT EXISTS view_election_turnout AS
SELECT 
    e.election_id,
    e.election_name,
    e.election_status,
    e.results_published,
    COUNT(ve.voter_id) AS total_registered_voters,
    SUM(CASE WHEN ve.is_eligible = 1 THEN 1 ELSE 0 END) AS eligible_voters,
    SUM(CASE WHEN ve.has_voted = 1 THEN 1 ELSE 0 END) AS votes_cast,
    ROUND(
        CASE 
            WHEN SUM(CASE WHEN ve.is_eligible = 1 THEN 1 ELSE 0 END) > 0 
            THEN (CAST(SUM(CASE WHEN ve.has_voted = 1 THEN 1 ELSE 0 END) AS REAL) * 100.0) / SUM(CASE WHEN ve.is_eligible = 1 THEN 1 ELSE 0 END)
            ELSE 0.0 
        END, 
        2
    ) AS turnout_percentage
FROM elections e
LEFT JOIN voter_eligibility ve ON e.election_id = ve.election_id
GROUP BY e.election_id, e.election_name, e.election_status, e.results_published;

-- View 2: Candidate Vote Standings
-- Demonstrates LEFT JOIN between candidates and anonymous votes
CREATE VIEW IF NOT EXISTS view_candidate_vote_totals AS
SELECT 
    c.election_id,
    e.election_name,
    c.candidate_id,
    c.candidate_name,
    c.party_or_group,
    COUNT(v.vote_id) AS total_votes
FROM candidates c
JOIN elections e ON c.election_id = e.election_id
LEFT JOIN votes v ON c.candidate_id = v.candidate_id AND c.election_id = v.election_id
GROUP BY c.election_id, e.election_name, c.candidate_id, c.candidate_name, c.party_or_group;

-- View 3: Blockchain Summary per Election
-- Demonstrates chain height, latest block and genesis linkage
CREATE VIEW IF NOT EXISTS view_blockchain_summary AS
SELECT 
    b.election_id,
    e.election_name,
    COUNT(b.block_id) AS total_blocks,
    MIN(b.block_index) AS genesis_block_index,
    MAX(b.block_index) AS latest_block_index,
    MAX(b.created_at) AS last_block_timestamp
FROM blockchain_blocks b
JOIN elections e ON b.election_id = e.election_id
GROUP BY b.election_id, e.election_name;
