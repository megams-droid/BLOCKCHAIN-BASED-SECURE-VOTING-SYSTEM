-- ========================================================
-- BLOCKCHAIN-BASED SECURE VOTING SYSTEM
-- Sample Seed Data (seed.sql)
-- Default Password for all accounts: Password@123
-- ========================================================

-- 1. Insert Users (Admin, Candidates, and Voters)
INSERT INTO users (user_id, full_name, email, password_hash, role, voter_reference, account_status) VALUES
(1, 'Chief Election Officer (Admin)', 'admin@voting.gov', '$2a$10$7Z25fD1uHk/P9n6P5fVjzeE6t6Xz7mG6n1u0w8p2r4t6y8u0w2e4r', 'admin', 'VOT-ADMIN-001', 'active'),
(2, 'Dr. Elena Vance', 'elena.vance@campus.edu', '$2a$10$7Z25fD1uHk/P9n6P5fVjzeE6t6Xz7mG6n1u0w8p2r4t6y8u0w2e4r', 'candidate', 'VOT-CAND-001', 'active'),
(3, 'Marcus Sterling', 'marcus.s@campus.edu', '$2a$10$7Z25fD1uHk/P9n6P5fVjzeE6t6Xz7mG6n1u0w8p2r4t6y8u0w2e4r', 'candidate', 'VOT-CAND-002', 'active'),
(4, 'Aaliyah Patel', 'aaliyah.p@campus.edu', '$2a$10$7Z25fD1uHk/P9n6P5fVjzeE6t6Xz7mG6n1u0w8p2r4t6y8u0w2e4r', 'candidate', 'VOT-CAND-003', 'active'),
(5, 'Alex Rivera (Voter)', 'alex.voter@campus.edu', '$2a$10$7Z25fD1uHk/P9n6P5fVjzeE6t6Xz7mG6n1u0w8p2r4t6y8u0w2e4r', 'voter', 'VOT-2026-8819', 'active'),
(6, 'Jordan Lee (Voter)', 'jordan.voter@campus.edu', '$2a$10$7Z25fD1uHk/P9n6P5fVjzeE6t6Xz7mG6n1u0w8p2r4t6y8u0w2e4r', 'voter', 'VOT-2026-9921', 'active'),
(7, 'Taylor Swift (Voter)', 'taylor.voter@campus.edu', '$2a$10$7Z25fD1uHk/P9n6P5fVjzeE6t6Xz7mG6n1u0w8p2r4t6y8u0w2e4r', 'voter', 'VOT-2026-4412', 'active');

-- 2. Insert Elections
INSERT INTO elections (election_id, election_name, description, start_time, end_time, election_status, results_published, created_by) VALUES
(1, '2026 University Student Council Presidential Election', 'Annual democratic election to elect the Student Council President representing 15,000+ collegiate scholars.', '2026-10-21 00:00:00', '2026-10-25 23:59:59', 'active', 0, 1),
(2, 'Department of Computer Science Academic Senator Election', 'Representative senate seat determining departmental curriculum feedback, research grants, and lab funding.', '2026-10-20 00:00:00', '2026-10-22 23:59:59', 'closed', 1, 1);

-- 3. Insert Candidates
INSERT INTO candidates (candidate_id, user_id, election_id, candidate_name, party_or_group, manifesto) VALUES
(1, 2, 1, 'Dr. Elena Vance', 'Digital Transformation Alliance', 'Fostering 24/7 library access, universal cloud compute subsidies, and open-source lab equipment.'),
(2, 3, 1, 'Marcus Sterling', 'Progressive Campus Union', 'Affordable student dining, transparent allocation of student fees, and improved transit passes.'),
(3, 4, 1, 'Aaliyah Patel', 'Innovation and Ethics Caucus', 'Promoting ethical AI research, mental health support days, and green campus sustainability.');

-- 4. Insert Voter Eligibility Records
INSERT INTO voter_eligibility (eligibility_id, voter_id, election_id, is_eligible, has_voted) VALUES
(1, 5, 1, 1, 0),
(2, 6, 1, 1, 0),
(3, 7, 1, 1, 0),
(4, 2, 1, 1, 0),
(5, 3, 1, 1, 0),
(6, 4, 1, 1, 0);

-- 5. Insert Genesis Blockchain Block for Election 1
INSERT INTO blockchain_blocks (block_id, election_id, block_index, previous_hash, current_hash, transaction_hash, created_at) VALUES
(1, 1, 0, '0000000000000000000000000000000000000000000000000000000000000000', '8306df31dc90f6dc45a3a082b6eb84f2e46edaca1bbe819d3c90e7422f1442ca', 'd0b26648faae5ff63e7c73e5e6eb6320992e32420803f1fcaacc899296164ccc', '2026-10-21 00:00:00');
