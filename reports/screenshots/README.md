# Application UI & Screen Walkthrough
**Project:** BLOCKCHAIN-BASED SECURE VOTING SYSTEM  
**Student:** MEGA SREE MS (711525BCS092)  
**Institution:** Kalaignarkarunanidhi Institute of Technology, Coimbatore  
**Application URL:** http://localhost:5173/

---

### 1. Landing Page (`LandingPage.jsx`)
- **Route:** `/`
- **Features:** 
  - Radiant White Mode interface with cybersecurity navy-blue (`#0f172a`) and teal (`#0d9488`) branding.
  - Live metric counters: Total enrolled voters, configured elections, mined blocks, and ledger health status (`100% VERIFIED`).
  - Interactive 4-step voting workflow explanation: (1) Identity & Eligibility, (2) Anonymous Ballot, (3) Atomic Block Mining, (4) Tamper-Proof Audit.
  - Quick action buttons to launch Elections, Verify Blockchain, AI Voice Assistant, and DBMS SQL Syllabus.

---

### 2. Elections & Voting Portal (`ElectionsPage.jsx` & `VotingModal.jsx`)
- **Route:** `/elections`
- **Features:**
  - Displays active elections (e.g., *2026 University Student Council Presidential Election*) and completed senate elections.
  - Shows candidate manifestos:
    - **Dr. Elena Vance** (Digital Transformation Alliance): 24/7 library access, cloud compute subsidies, open-source lab gear.
    - **Marcus Sterling** (Progressive Campus Union): Affordable dining, transit passes, fee transparency.
    - **Aaliyah Patel** (Innovation and Ethics Caucus): Ethical AI, green sustainability, mental health days.
  - **Voting Modal:** Selecting a candidate displays a verification preview. Clicking "Confirm & Cast Ballot" executes an atomic ACID transaction that:
    1. Sets `voter_eligibility.has_voted = 1` for the voter.
    2. Mines a new SHA-256 block linked to the preceding block.
    3. Persists an anonymous ballot in `votes` with a one-way hashed token.
    4. Delivers a non-revealing cryptographic receipt to the voter.

---

### 3. Cryptographic Blockchain Explorer (`BlockchainExplorerPage.jsx`)
- **Route:** `/explorer`
- **Features:**
  - Visual cards representing each block in the chain:
    - **Block #0 (Genesis):** Previous hash: `0000000000000000000000000000000000000000000000000000000000000000`.
    - **Block #1, #2, ...:** Previous hash pointing to the preceding block's `current_hash`.
  - Transaction hash, block index, and ISO-8601 creation timestamp.

---

### 4. Integrity Verification & Tamper Simulation (`IntegrityVerificationPage.jsx`)
- **Route:** `/verification`
- **Features:**
  - Audits all block hashes and sequential previous-hash links in real time.
  - **"Simulate Tamper Attack" Button:** Deliberately modifies a test block's current hash to `deadbeef...`. Re-running verification immediately flags the discrepancy:
    - Status: `Previous-hash mismatch` / `Integrity verification failed`.
    - Flags the exact corrupted block index with red visual alerts.
  - **"Restore Ledger" Button:** Recalculates the true canonical SHA-256 hash and restores the chain to `100% VERIFIED`.

---

### 5. Election Results & Analytics (`ResultsPage.jsx`)
- **Route:** `/results`
- **Features:**
  - Candidate vote standings with proportional progress bars.
  - Voter turnout percentage calculated from `voter_eligibility`.
  - Winner declaration banner when election status is `closed` and results are published.

---

### 6. Admin Dashboard (`AdminDashboardPage.jsx`)
- **Route:** `/admin`
- **Features:**
  - Protected route requiring `role == 'admin'` (Chief Election Officer).
  - Create and schedule new elections with date/time pickers.
  - Register new candidates and assign them to elections.
  - Audit log table displaying actor, action (`VOTE_CAST`, `ELECTION_CREATED`), and timestamp.
  - One-click CSV summary export.

---

### 7. Interactive DBMS SQL Syllabus Terminal (`SqlDemoPage.jsx`)
- **Route:** `/sqldemo`
- **Features:**
  - Academic evaluation workbench executing live SQL queries against SQLite/MySQL:
    - Candidate listing with `ORDER BY`.
    - Eligible voter count using `COUNT(*)`.
    - Turnout calculation using `CASE WHEN has_voted = 1`.
    - Candidate vote totals using `LEFT JOIN` and `GROUP BY`.
    - Transaction rollback demonstration.

---

### 8. AI Voice Assistant (`VoiceAssistantModal.jsx` & `useVoiceAssistant.js`)
- **Trigger:** Floating microphone button or Navbar AI Voice trigger.
- **Features:**
  - Web Speech API integration (Speech Recognition & Speech Synthesis).
  - Spoken theme commands:
    - *"Switch to White mode"* -> Sets White Mode and speaks audible confirmation.
    - *"Switch to Dark mode"* -> Sets Dark Mode and speaks audible confirmation.
  - Spoken query commands:
    - *"Verify blockchain integrity"* -> Executes live API verification and speaks report.
    - *"Show active elections"*, *"Show live results"*, *"Candidate manifestos"*.
