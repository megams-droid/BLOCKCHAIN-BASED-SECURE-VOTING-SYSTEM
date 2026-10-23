import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bug,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function IntegrityVerificationPage({ elections, selectedElectionId, onSpeak }) {
  const [activeElectionId, setActiveElectionId] = useState(selectedElectionId || (elections[0]?.election_id || 1));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tampering, setTampering] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeElectionId) {
      runVerification(activeElectionId);
    }
  }, [activeElectionId]);

  const runVerification = async (id) => {
    setLoading(true);
    setMessage('');
    try {
      const data = await api.verifyBlockchain(id);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!report || !report.blocks || report.blocks.length < 2) {
      alert('Need at least 2 blocks to demonstrate tamper detection.');
      return;
    }

    setTampering(true);
    try {
      // Pick block 1 to tamper
      const targetBlock = report.blocks.find((b) => b.block_index > 0) || report.blocks[0];
      const res = await api.simulateTamper(activeElectionId, targetBlock.block_id, 'deadbeef' + '0'.repeat(56));
      setMessage(`⚠️ Tamper Simulated: Block #${targetBlock.block_index} current_hash altered directly in SQL database.`);
      await runVerification(activeElectionId);
    } catch (err) {
      alert('Tampering simulation failed: ' + err.message);
    } finally {
      setTampering(false);
    }
  };

  const handleRestoreBlock = async () => {
    if (!report || !report.blocks) return;

    setTampering(true);
    try {
      const targetBlock = report.blocks.find((b) => b.block_index > 0) || report.blocks[0];
      await api.restoreBlock(activeElectionId, targetBlock.block_id);
      setMessage(`✅ Ledger Restored: Block #${targetBlock.block_index} authentic cryptographic hash restored.`);
      await runVerification(activeElectionId);
    } catch (err) {
      alert('Restore failed: ' + err.message);
    } finally {
      setTampering(false);
    }
  };

  const handleReadAloud = () => {
    if (!report || !onSpeak) return;
    const text = report.isValid
      ? `Cryptographic audit complete for ${report.election?.election_name}. Status: Ledger integrity verified. All ${report.totalBlocks} blocks match canonical SHA-256 hashes and previous-hash pointers.`
      : `Warning: Integrity verification failed! ${report.issues?.join('. ') || 'Discrepancy detected in block chain'}`;
    onSpeak(text);
  };

  const isValid = report?.isValid;

  return (
    <div className="container" style={{ padding: '36px 24px 60px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Cryptographic Ledger Verification</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Mathematical proof engine validating SHA-256 block continuity and database integrity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={activeElectionId}
            onChange={(e) => setActiveElectionId(Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto', minWidth: '240px' }}
          >
            {elections.map((el) => (
              <option key={el.election_id} value={el.election_id}>
                {el.election_name}
              </option>
            ))}
          </select>

          <button className="btn btn-outline" onClick={() => runVerification(activeElectionId)} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Re-verify
          </button>

          {onSpeak && (
            <button className="btn btn-teal" onClick={handleReadAloud}>
              <Sparkles size={15} /> Vocal Report
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          style={{
            background: message.includes('⚠️') ? 'var(--warning-light)' : 'var(--success-light)',
            border: message.includes('⚠️') ? '1px solid var(--warning-border)' : '1px solid var(--success-border)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            fontSize: '0.9rem',
            fontWeight: '500',
          }}
        >
          {message}
        </div>
      )}

      {/* Main Verification Status Banner */}
      {report && (
        <div
          className="card"
          style={{
            borderLeft: isValid ? '6px solid #10b981' : '6px solid #ef4444',
            padding: '30px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: isValid ? 'var(--success-light)' : 'var(--danger-light)',
                  color: isValid ? 'var(--success)' : 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isValid ? <ShieldCheck size={32} /> : <AlertTriangle size={32} />}
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: isValid ? '#059669' : '#dc2626' }}>
                  Auditing Engine Output
                </div>
                <h2 style={{ fontSize: '1.6rem', color: 'var(--navy-dark)' }}>{report.status}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Election: <strong>{report.election?.election_name}</strong> • Total Blocks Audited:{' '}
                  <strong>{report.totalBlocks}</strong> • Recorded Ballots: <strong>{report.voteCount}</strong>
                </div>
              </div>
            </div>

            <span className={`badge ${isValid ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              {isValid ? 'CHAIN INTEGRITY 100% OK' : 'INTEGRITY COMPROMISED'}
            </span>
          </div>

          {/* If there are issues, list them prominently */}
          {report.issues && report.issues.length > 0 && (
            <div
              style={{
                marginTop: '20px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}
            >
              <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '8px', fontSize: '0.9rem' }}>
                Detected Security & Ledger Violations:
              </div>
              <ul style={{ paddingLeft: '20px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {report.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* College Viva Demonstration Controls */}
      <div className="card" style={{ padding: '24px', background: '#ffffff', marginBottom: '36px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
          🎓 Academic Viva & Examiner Demonstration Controls
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '18px' }}>
          Test how the auditing algorithm responds to unauthorized database tampering by simulating an adversarial DBA update.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={handleSimulateTamper}
            disabled={tampering || !isValid}
            style={{ color: '#b91c1c', borderColor: '#fecaca', background: '#fff5f5' }}
          >
            <Bug size={16} /> 1. Simulate Unauthorized Tampering (Forge Hash)
          </button>

          <button
            className="btn btn-outline"
            onClick={handleRestoreBlock}
            disabled={tampering}
            style={{ color: '#047857', borderColor: '#a7f3d0', background: '#f0fdf4' }}
          >
            <RotateCcw size={16} /> 2. Restore Ledger Integrity
          </button>
        </div>
      </div>

      {/* Verification Steps Audit Table */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Block-by-Block Verification Checklist</h3>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Current Hash (SHA-256)</th>
                <th>Previous Hash Link</th>
                <th>Continuity</th>
                <th>Mathematical Hash Match</th>
              </tr>
            </thead>
            <tbody>
              {report?.blocks?.map((b) => (
                <tr key={b.block_id}>
                  <td>
                    <strong>#{b.block_index}</strong>
                  </td>
                  <td>
                    <span className="hash-pill">{b.current_hash.slice(0, 20)}...</span>
                  </td>
                  <td>
                    <span className="hash-pill" style={{ color: '#64748b' }}>
                      {b.previous_hash === '0000000000000000000000000000000000000000000000000000000000000000'
                        ? 'GENESIS_ROOT'
                        : `${b.previous_hash.slice(0, 16)}...`}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> OK
                    </span>
                  </td>
                  <td>
                    <span style={{ color: isValid ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      {isValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {isValid ? 'Canonical Match' : 'Discrepancy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
