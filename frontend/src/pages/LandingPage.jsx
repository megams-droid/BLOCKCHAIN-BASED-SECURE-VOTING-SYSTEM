import React from 'react';
import {
  ShieldCheck,
  Boxes,
  Lock,
  Vote,
  Database,
  ArrowRight,
  CheckCircle2,
  FileCode,
  Users,
  Activity,
  Zap,
  Sparkles,
} from 'lucide-react';

export default function LandingPage({ onNavigate, stats, onOpenVoice }) {
  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <Sparkles size={14} color="#0284c7" />
          <span>DBMS Mini-Project • Powered by Relational Integrity & SHA-256 Ledger</span>
        </div>

        <h1 className="hero-title">
          Blockchain-Based <span className="hero-gradient">Secure Voting System</span>
        </h1>

        <p className="hero-desc">
          A secure, transparent, and user-friendly electronic voting system combining a normalized relational DBMS
          with a custom cryptographic hash-linked ledger to detect unauthorized modifications.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => onNavigate('elections')}>
            <Vote size={18} /> View Elections & Vote
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onNavigate('verification')}>
            <ShieldCheck size={18} color="#0d9488" /> Verify Blockchain
          </button>
          <button className="btn btn-teal btn-lg" onClick={onOpenVoice}>
            <Sparkles size={18} /> AI Voice Assistant
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onNavigate('sqldemo')}>
            <Database size={18} /> DBMS SQL Syllabus
          </button>
        </div>
      </section>

      {/* Stats Counter Bar in Clean Light Mode */}
      <section style={{ margin: '30px 0 50px 0' }}>
        <div className="grid-4">
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>
              {stats?.total_registered_users || 7}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Enrolled Voters & Users
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--teal)' }}>
              {stats?.total_elections || 2}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Configured Elections
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#6366f1' }}>
              {stats?.total_blockchain_blocks || 5}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Cryptographic Blocks
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: stats?.is_ledger_valid ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                height: '48px',
              }}
            >
              <ShieldCheck size={24} /> {stats?.is_ledger_valid ? '100% VERIFIED' : 'TAMPER DETECTED'}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Ledger Health Status
            </div>
          </div>
        </div>
      </section>

      {/* How Voting Works - Interactive 4-step Pipeline */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>How Voting Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            A rigorous 4-step workflow ensuring ballot secrecy, duplicate-vote prevention, and mathematical immutability.
          </p>
        </div>

        <div className="grid-4">
          <div className="card">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                marginBottom: '16px',
              }}
            >
              01
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Identity & Eligibility</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Voters authenticate using bcrypt-hashed credentials and unique voter references. Relational constraints verify eligibility per election.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ccfbf1',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                marginBottom: '16px',
              }}
            >
              02
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Anonymous Ballot</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Voter identity is recorded in <code>voter_eligibility</code> to mark participation, while candidate choice is stored separately without identifiable tokens.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                marginBottom: '16px',
              }}
            >
              03
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Atomic Block Mining</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              The backend computes a SHA-256 digest linking the ballot to the preceding block's hash. The block and ballot persist atomically via ACID transaction.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                marginBottom: '16px',
              }}
            >
              04
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Tamper-Proof Audit</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Anyone can audit the ledger. If any record or previous hash is modified, cryptographic re-calculation instantly flags the exact invalid block.
            </p>
          </div>
        </div>
      </section>

      {/* Core Technical Highlights: DBMS & Blockchain */}
      <section className="card" style={{ padding: '36px', background: '#ffffff', marginBottom: '50px' }}>
        <div className="grid-2" style={{ alignItems: 'center' }}>
          <div>
            <div className="badge badge-active" style={{ marginBottom: '14px' }}>
              Academic DBMS Evaluation Ready
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '14px' }}>
              Engineered for College Demonstration & Viva
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.6' }}>
              This system demonstrates full 3NF relational modeling, foreign-key integrity, transactional ACID safety,
              and cryptographic ledger auditing without simulated frontend mockups.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>
                  <strong>Queries A–F Demonstrated:</strong> Live GROUP BY, COUNT, SUM(CASE), LEFT JOIN, and subqueries.
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>
                  <strong>Deterministic SHA-256 Ledger:</strong> Canonical block formatting and index continuity.
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>
                  <strong>Interactive Tamper Simulation:</strong> Intentionally forge a hash to prove the audit engine catches it live!
                </span>
              </li>
            </ul>

            <div style={{ marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('sqldemo')}>
                Open DBMS Query Terminal <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Code/Architecture Preview */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: '#334155',
            }}
          >
            <div style={{ color: '#0284c7', fontWeight: '600', marginBottom: '10px' }}>
              // Canonical Block Hash Formula
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              current_hash = SHA256(
                election_id + "|" +
                block_index + "|" +
                previous_hash + "|" +
                transaction_hash + "|" +
                timestamp
              )
            </div>

            <div style={{ color: '#0d9488', fontWeight: '600', marginBottom: '10px' }}>
              // Relational Isolation Schema (3NF)
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              voter_eligibility (voter_id, election_id, has_voted) <br />
              votes (election_id, candidate_id, block_id) <br />
              blockchain_blocks (block_id, previous_hash, current_hash)
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
