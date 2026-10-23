# Academic Project Report: Blockchain-Based Secure Voting System
**DBMS Mini-Project & Cybersecurity Architecture Documentation**  
**Project Name:** Blockchain-Based Secure Voting System  
**Tagline:** *"Your Vote. Your Voice. Securely."*  
**Platform:** Antigravity AI-Powered Engineering Workspace  

---

## 1. Abstract
The **Blockchain-Based Secure Voting System** is a full-stack electronic voting platform engineered to guarantee ballot secrecy, verifiable participation, and mathematical auditability. By pairing a normalized relational Database Management System (3NF schema) with a SHA-256 hash-linked cryptographic ledger, the application addresses traditional electronic voting pitfalls such as duplicate ballot injection, database tampering, and voter intimidation. The application provides role-based access control (Admin, Candidate, Voter), live election scheduling, cryptographic verification of previous-hash linkages, and an integrated AI Voice Assistant with support for both modern White Mode and Dark Mode styling.

---

## 2. Objectives
1. **Relational Integrity:** Implement a normalized DBMS enforcing entity, referential, domain, and custom business constraints (`UNIQUE`, `CHECK`, `NOT NULL`, `FOREIGN KEY ON DELETE CASCADE/RESTRICT`).
2. **Anonymous Ballot Architecture:** Mathematically decouple the voter's identity record in `voter_eligibility` from the ballot cast in `votes`, guaranteeing secret ballots while strictly enforcing "One Vote Per Registered Voter".
3. **Cryptographic Tamper-Detection:** Link each accepted vote into an append-only ledger (`blockchain_blocks`) where each block stores the previous block's SHA-256 hash. Any retroactive database modification immediately invalidates subsequent hash pointers.
4. **Interactive AI Voice Assistant:** Provide an accessible speech-enabled interface allowing users to navigate elections, inspect candidates, trigger cryptographic ledger audits, and toggle UI themes using spoken English commands.
5. **Academic Viva Utility:** Include interactive SQL demonstrations (`GROUP BY`, `HAVING`, relational joins, aggregation, subqueries, transaction commit/rollback) for evaluative academic demonstration.

---

## 3. Existing System vs. Proposed System

| Dimension | Existing / Traditional Electronic Voting | Proposed Blockchain-Based DBMS System |
| :--- | :--- | :--- |
| **Data Storage** | Centralized, flat relational database with direct admin edits | Normalized relational tables coupled with SHA-256 hash-linked ledger |
| **Ballot Privacy** | Often stores voter ID directly alongside ballot selection | Anonymous ballot model separating eligibility status from ballot choices |
| **Tamper Detection** | Dependent solely on audit logs which can be altered by DBAs | Cryptographic pointer check; any altered record breaks hash continuity |
| **Duplicate Prevention** | Application-level checks prone to race conditions | ACID transactions with database-level uniqueness constraints |
| **Accessibility** | Static mouse/keyboard interface | Multimodal interface with AI Voice Assistant (Speech-to-Text & Text-to-Speech) |
| **Visual Ergonomics** | Fixed dark or legacy themes | High-contrast White Mode by default with instant Dark Mode switching |

---

## 4. System Architecture

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION TIER (UI/UX)                            |
|  - React 18 SPA + Vite                                                            |
|  - Modern White Mode (Radiant #ffffff cards, slate navy text, teal accents)        |
|  - Theme Switcher (White Mode / Dark Mode) & LocalStorage State                   |
|  - Web Speech API Voice Assistant (SpeechSynthesis & SpeechRecognition)           |
+-----------------------------------------------------------------------------------+
                                       | HTTP / REST (JSON + JWT)
                                       v
+-----------------------------------------------------------------------------------+
|                               APPLICATION SERVICE TIER                            |
|  - Express.js HTTP Server (Node.js)                                               |
|  - JWT Authentication & Bcrypt Password Hashing (Salt Rounds: 10)                 |
|  - Role-Based Access Control Middleware (Admin, Voter, Candidate)                 |
|  - Ledger Hashing Service (SHA-256 Block Generation & Verification)               |
|  - Audit Logging Middleware (Non-sensitive transactional telemetry)               |
+-----------------------------------------------------------------------------------+
                                       | ACID SQL Queries (better-sqlite3 / MySQL)
                                       v
+-----------------------------------------------------------------------------------+
|                              PERSISTENCE & DATA TIER                              |
|  - Normalized Relational Tables (users, elections, candidates, voter_eligibility) |
|  - Secret Ballot Table (votes: encrypted_or_protected_vote_reference, block_id)   |
|  - Append-Only Cryptographic Blocks (blockchain_blocks)                           |
|  - Materialized Relational Views & Parameterized Queries                          |
+-----------------------------------------------------------------------------------+
```

---

## 5. Database Schema & Normalization (Up to 3NF)

### 5.1 Relational Normalization Analysis
- **First Normal Form (1NF):** All attributes contain atomic values. Each table contains a unique primary key (`user_id`, `election_id`, `candidate_id`, `eligibility_id`, `vote_id`, `block_id`). No repeating groups or comma-separated lists exist.
- **Second Normal Form (2NF):** All non-key attributes are fully functionally dependent on the entire primary key. In composite relationships (such as candidate election mapping and voter eligibility), tables use surrogate primary keys with compound unique constraints (`UNIQUE(voter_id, election_id)`).
- **Third Normal Form (3NF):** No transitive dependencies exist. Candidate details, election details, and user profiles are stored in distinct entities. For instance, `candidate_name` and `party_or_group` are not duplicated in the `votes` table; only the foreign key `candidate_id` is maintained.

### 5.2 Table Specifications
1. **`users`**:
   - `user_id` (INTEGER, PK, AUTOINCREMENT)
   - `full_name` (VARCHAR(150), NOT NULL)
   - `email` (VARCHAR(255), UNIQUE, NOT NULL)
   - `password_hash` (VARCHAR(255), NOT NULL)
   - `role` (VARCHAR(20), CHECK role IN ('voter', 'candidate', 'admin'))
   - `voter_reference` (VARCHAR(50), UNIQUE)
   - `account_status` (VARCHAR(20), DEFAULT 'active')
   - `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

2. **`elections`**:
   - `election_id` (INTEGER, PK, AUTOINCREMENT)
   - `election_name` (VARCHAR(200), NOT NULL)
   - `description` (TEXT)
   - `start_time` (DATETIME, NOT NULL)
   - `end_time` (DATETIME, NOT NULL)
   - `election_status` (VARCHAR(20), CHECK IN ('upcoming', 'active', 'closed'))
   - `results_published` (INTEGER, DEFAULT 0)
   - `created_by` (INTEGER, FK -> users.user_id)

3. **`candidates`**:
   - `candidate_id` (INTEGER, PK, AUTOINCREMENT)
   - `user_id` (INTEGER, FK -> users.user_id)
   - `election_id` (INTEGER, FK -> elections.election_id)
   - `candidate_name` (VARCHAR(150), NOT NULL)
   - `party_or_group` (VARCHAR(150))
   - `manifesto` (TEXT)
   - `UNIQUE(user_id, election_id)`

4. **`voter_eligibility`**:
   - `eligibility_id` (INTEGER, PK, AUTOINCREMENT)
   - `voter_id` (INTEGER, FK -> users.user_id)
   - `election_id` (INTEGER, FK -> elections.election_id)
   - `is_eligible` (INTEGER, DEFAULT 1)
   - `has_voted` (INTEGER, DEFAULT 0)
   - `UNIQUE(voter_id, election_id)`

5. **`votes`**:
   - `vote_id` (INTEGER, PK, AUTOINCREMENT)
   - `election_id` (INTEGER, FK -> elections.election_id)
   - `candidate_id` (INTEGER, FK -> candidates.candidate_id)
   - `encrypted_or_protected_vote_reference` (VARCHAR(64), NOT NULL)
   - `cast_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
   - `block_id` (INTEGER, FK -> blockchain_blocks.block_id)

6. **`blockchain_blocks`**:
   - `block_id` (INTEGER, PK, AUTOINCREMENT)
   - `election_id` (INTEGER, FK -> elections.election_id)
   - `block_index` (INTEGER, NOT NULL)
   - `previous_hash` (CHAR(64), NOT NULL)
   - `current_hash` (CHAR(64), NOT NULL)
   - `transaction_hash` (CHAR(64), NOT NULL)
   - `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
   - `UNIQUE(election_id, block_index)`

7. **`audit_logs`**:
   - `log_id` (INTEGER, PK, AUTOINCREMENT)
   - `actor_user_id` (INTEGER, NULLABLE, FK -> users.user_id)
   - `action_type` (VARCHAR(50), NOT NULL)
   - `entity_type` (VARCHAR(50), NOT NULL)
   - `entity_reference` (VARCHAR(100))
   - `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)

---

## 6. Cryptographic Blockchain Implementation
For every accepted ballot, the backend executes an atomic ACID transaction:
1. Validates that `election_status == 'active'`, `is_eligible == 1`, and `has_voted == 0`.
2. Marks `has_voted = 1` in `voter_eligibility`.
3. Retrieves the preceding block for the election (or Genesis Block `#0` with previous hash `0000000000000000000000000000000000000000000000000000000000000000`).
4. Calculates deterministic `transaction_hash`:
   $$\text{tx\_hash} = \text{SHA256}(\text{election\_id} \parallel \text{candidate\_id} \parallel \text{timestamp} \parallel \text{salt})$$
5. Calculates current block hash:
   $$\text{block\_hash} = \text{SHA256}(\text{election\_id} \parallel \text{block\_index} \parallel \text{previous\_hash} \parallel \text{tx\_hash} \parallel \text{timestamp})$$
6. Inserts the new block and vote reference atomically. If any constraint fails, the transaction issues a full rollback.

### Integrity Verification Algorithm
The verification endpoint (`GET /api/blockchain/:electionId/verify`) iterates over all blocks in ascending order of `block_index`:
- Validates index continuity: $block[i].index == i$.
- Validates pointer continuity: $block[i].previous\_hash == block[i-1].current\_hash$.
- Recalculates $block[i].current\_hash$ over canonical fields and verifies equality.
- Confirms the total number of blocks matches total recorded votes $+ 1$ (Genesis).

---

## 7. AI Voice Assistant Implementation
The frontend implements an AI Voice Assistant using the **Web Speech API**:
- **Speech Recognition (STT):** Captures microphone audio, streams real-time speech hypotheses, and normalizes spoken text into intent tokens.
- **Speech Synthesis (TTS):** Utilizes `window.speechSynthesis` with optimized natural English voice synthesis.
- **Handled Intents:**
  1. *Theme Control:* "Switch to White Mode", "Change dark mode into white mode", "Dark Mode", "Toggle theme".
  2. *Cryptographic Verification:* "Verify blockchain integrity" -> triggers live verification and speaks the health summary.
  3. *Navigation & Inquiries:* "Show active elections", "Who is winning?", "Candidate manifestos", "How voting works", "Open SQL demo".
  4. *Typed Fallback:* Clean chat window with audio wave visualizer and quick-action chips.

---

## 8. Test Cases & Results

| Test Case | Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | Cryptographic Hash Determinism | SHA-256 produce consistent digests for identical canonical inputs | ✅ PASS |
| **TC-02** | Clean Ledger Verification | Verification passes with `isValid: true` on unmanipulated chain | ✅ PASS |
| **TC-03** | Duplicate Vote Prevention | Second ballot attempt by same voter triggers constraint violation and rollback | ✅ PASS |
| **TC-04** | Tamper Detection Simulation | Modifying previous hash or payload in block `#1` flags `Previous-hash mismatch` | ✅ PASS |
| **TC-05** | Unauthorized Admin Access | Voter role attempting admin election creation is rejected with HTTP 403 | ✅ PASS |
| **TC-06** | Theme Switcher | Toggling White/Dark mode updates CSS variables and persists in `localStorage` | ✅ PASS |
| **TC-07** | Voice Command Execution | Speaking "Switch to White Mode" invokes theme state updater and speaks confirmation | ✅ PASS |

---

## 9. Limitations & Educational Scope
- **Educational Blockchain Scope:** Hash linking demonstrates data integrity against unauthorized database row modifications. However, in a centralized DBMS deployment, a database superuser with root access could theoretically recalculate hashes across the chain. Full production decentralization would require distributed consensus nodes (e.g., Proof of Stake or Raft).
- **Client-Side Speech API:** Speech recognition availability depends on browser support (`webkitSpeechRecognition`); typed fallback ensures 100% universal compatibility.

---

## 10. Conclusion
The **Blockchain-Based Secure Voting System** successfully integrates modern web design, relational database principles (3NF, ACID transactions, referential integrity), and cryptographic hashing. The combination of an intuitive White Mode UI, interactive AI Voice Assistant, and live blockchain verification provides an exceptional platform for university demonstrations, viva examinations, and technical presentations.
