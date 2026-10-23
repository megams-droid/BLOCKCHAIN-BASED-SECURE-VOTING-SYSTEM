# Blockchain-Based Secure Voting System
> **Tagline:** *"Your Vote. Your Voice. Securely."*  
> **DBMS Academic Project** • Normalized Relational Architecture + Cryptographic SHA-256 Ledger + AI Voice Assistant  
> **Student:** **MEGA SREE MS** (Reg. No: **711525BCS092**)  
> **Institution:** **Kalaignarkarunanidhi Institute of Technology, Coimbatore**  
> **Department:** Computer Science and Engineering (CSE-C) | Academic Year: 2025–2029  

---

## 🏛️ Project Overview
The **Blockchain-Based Secure Voting System** is a complete, production-grade electronic voting application built for DBMS evaluation, viva demonstrations, and cybersecurity integrity testing.

It couples a normalized relational DBMS (handling users, roles, voter eligibility, election scheduling, and candidate profiles) with a custom **hash-linked cryptographic ledger (SHA-256)** that tracks each cast ballot and provides instant mathematical tamper-detection.

### ✨ Key Highlights
1. **White Mode Default Aesthetics:** Crisp white background (`#ffffff`), slate navy text, and teal accents with an interactive **White Mode / Dark Mode** toggle in the Navbar.
2. **Integrated AI Voice Assistant:** 
   - Voice-controlled navigation (Web Speech API).
   - Voice-controlled theme switching: *"Switch to white mode"*, *"Change dark mode into white mode"*, *"Dark mode"*.
   - Live query answering: Candidate manifestos, election status, live verification audits, and SQL syllabus explanations.
3. **Anonymous Ballot Architecture:** Voter participation is separated from ballot choice to ensure absolute ballot secrecy while enforcing the strict "One Vote Per Eligible Voter" constraint.
4. **Blockchain Integrity Verifier:** Real-time SHA-256 block-pointer continuity audits with a built-in **"Simulate Tamper Attack"** button to demonstrate how database unauthorized modifications are caught in real-time.
5. **Interactive DBMS Syllabus Demo:** Built-in interactive SQL execution terminal demonstrating `GROUP BY`, `HAVING`, relational `LEFT JOIN`s, aggregate functions (`COUNT`, `SUM`), subqueries, and ACID transaction rollbacks.

---

## 🏗️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Lucide Icons | Responsive modern SPA with White Mode & Dark Mode |
| **UI Aesthetics** | Vanilla CSS Design Tokens | Navy-Blue, Crisp White, & Teal Accents |
| **Voice Engine** | Web Speech API | Dual-mode: Voice synthesis (TTS) & recognition (STT) + chat |
| **Backend** | Node.js, Express.js | REST API with JWT authentication & role-based middleware |
| **Database** | Normalized Relational SQL (SQLite / MySQL) | ACID transactions, foreign keys, unique constraints |
| **Ledger** | SHA-256 Cryptographic Hash Linking | Genesis block, block index, previous hash & transaction digest |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+) & npm

### 1. Install & Start Backend
```bash
cd backend
npm install
node src/app.js
```
*Backend runs at `http://localhost:5001` (SQLite initialized automatically).*

### 2. Install & Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

### 3. Run Automated Tests
```bash
npm test
```
Tests pass 4 critical assertions:
- Cryptographic hash determinism
- Blockchain verification on clean ledger
- Duplicate-vote prevention and atomic rollback
- Tamper detection simulation

---

## 👥 Pre-Configured Demo Accounts (Password: `Password@123`)

| Role | Name | Email | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | Chief Election Officer | `admin@voting.gov` | Create elections, manage candidates, publish results, view audit logs |
| **Candidate** | Dr. Elena Vance | `elena.vance@campus.edu` | View candidate portal, update manifesto, inspect vote count |
| **Candidate** | Marcus Sterling | `marcus.s@campus.edu` | View candidate portal, campaign standings |
| **Voter** | Alex Rivera | `alex.voter@campus.edu` | Check eligibility, cast secure vote, verify receipt |
| **Voter** | Jordan Lee | `jordan.voter@campus.edu` | Cast ballot, test duplicate vote rejection |

---

## 🎤 AI Voice Assistant Commands
Click the floating microphone or Navbar **AI Voice** button, or speak:
- `"Switch to White mode"` / `"Change dark mode into white mode"`
- `"Switch to Dark mode"`
- `"Verify blockchain integrity"`
- `"Show active elections"`
- `"Show live results"`
- `"Who are the candidates?"`
- `"How does voting work?"`
- `"Open SQL demo"`

---

## 📊 Database Schema (3NF)

```
+--------------------+        +---------------------+        +--------------------+
|       USERS        |        |      ELECTIONS      |        |     CANDIDATES     |
+--------------------+        +---------------------+        +--------------------+
| PK user_id         | 1    * | PK election_id      | 1    * | PK candidate_id    |
|    email (UNIQUE)  |------->|    election_name    |<-------| FK election_id     |
|    full_name       |        |    start_time       |        | FK user_id         |
|    role            |        |    end_time         |        |    candidate_name  |
|    voter_reference |        |    election_status  |        |    manifesto       |
+--------------------+        +---------------------+        +--------------------+
         | 1                             | 1
         |                               |
         | *                             | *
+--------------------+        +---------------------+        +--------------------+
| VOTER_ELIGIBILITY  |        |        VOTES        |        | BLOCKCHAIN_BLOCKS  |
+--------------------+        +---------------------+        +--------------------+
| PK eligibility_id  |        | PK vote_id          |        | PK block_id        |
| FK voter_id        |        | FK election_id      |        | FK election_id     |
| FK election_id     |        | FK candidate_id     |        |    block_index     |
|    has_voted       |        |    cast_at          |------->|    previous_hash   |
|    is_eligible     |        | FK block_id         |        |    current_hash    |
+--------------------+        +---------------------+        +--------------------+
```

---

## 📜 Viva & Demonstration Checklist
- [x] **Relational Schema:** Foreign keys, unique constraints, and check constraints verified.
- [x] **Duplicate Voting Prevention:** Tested via atomic transaction; second attempt is rejected.
- [x] **Tamper Detection:** Demonstrated in the Verify tab with simulated attack.
- [x] **Voice Assistant:** Speech recognition, text-to-speech, and theme switching verified.
- [x] **White Mode & Dark Mode:** Verified with seamless light-mode default aesthetic.
