import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  ArrowRight,
  FileText,
  Boxes,
} from 'lucide-react';

export default function VotingModal({ election, currentUser, onClose, onVoteSuccess }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [step, setStep] = useState(1); // 1: Select Candidate, 2: Review & Cryptographic Confirm, 3: Success Receipt
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (election) {
      loadCandidates();
    }
  }, [election]);

  const loadCandidates = async () => {
    try {
      const data = await api.getCandidates(election.election_id);
      setCandidates(data.candidates || []);
    } catch (err) {
      setError('Failed to load candidate roster.');
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidate) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.castVote(election.election_id, selectedCandidate.candidate_id);
      setReceipt(res.receipt);
      setStep(3);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onVoteSuccess) onVoteSuccess();
    } catch (err) {
      setError(err.message || 'Voting failed. Please verify your eligibility.');
    } finally {
      setLoading(false);
    }
  };

  if (!election) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                Secure Ballot
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Step {step} of 3
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginTop: '4px' }}>{election.election_name}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: 'var(--danger)',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Candidate Selection */}
          {step === 1 && (
            <div>
              <div
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '0.84rem',
                  color: '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Lock size={18} />
                <span>
                  <strong>Ballot Secrecy Guarantee:</strong> Your vote is anonymized using SHA-256 and will not be linked to your identity.
                </span>
              </div>

              <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.92rem' }}>
                Select your candidate:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
                {candidates.map((cand) => {
                  const isSelected = selectedCandidate?.candidate_id === cand.candidate_id;
                  return (
                    <div
                      key={cand.candidate_id}
                      onClick={() => setSelectedCandidate(cand)}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontWeight: '700', fontSize: '1.02rem', color: 'var(--navy-dark)' }}>
                          {cand.candidate_name}
                        </div>
                        <span className="badge badge-upcoming" style={{ fontSize: '0.72rem' }}>
                          {cand.party_or_group}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {cand.manifesto || 'No manifesto text provided.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Review & Cryptographic Confirm */}
          {step === 2 && selectedCandidate && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <Vote size={28} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Confirm Your Selection</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Once cast, your ballot is permanently committed to the blockchain and cannot be changed or submitted again.
                </p>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '600' }}>
                  Chosen Candidate
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--navy-dark)', marginTop: '2px' }}>
                  {selectedCandidate.candidate_name}
                </div>
                <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '14px' }}>
                  {selectedCandidate.party_or_group}
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <div><strong>Voter ID Reference:</strong> {currentUser?.voter_reference || 'VOT-ANONYMOUS'}</div>
                  <div><strong>Consensus Protocol:</strong> SHA-256 Hash-Chaining with ACID Transaction</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Cryptographic Blockchain Receipt */}
          {step === 3 && receipt && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--success-light)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--navy-dark)', marginBottom: '4px' }}>
                  Ballot Cast & Verified!
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Your vote has been mined into a permanent block in the blockchain ledger.
                </p>
              </div>

              {/* Receipt Details Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Block Height:</span>
                  <strong style={{ color: 'var(--primary)' }}>#{receipt.block_index}</strong>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Current Block Hash (SHA-256):</span>
                  <div className="hash-pill">{receipt.current_hash}</div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Preceding Block Hash:</span>
                  <div className="hash-pill" style={{ color: '#475569' }}>{receipt.previous_hash}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                  <span>{new Date(receipt.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-footer">
          {step === 1 && (
            <>
              <button className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!selectedCandidate}
                onClick={() => setStep(2)}
              >
                Next <ArrowRight size={16} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button className="btn btn-outline" onClick={() => setStep(1)} disabled={loading}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleCastVote} disabled={loading}>
                {loading ? 'Mining Block...' : 'Submit & Sign Ballot'}
              </button>
            </>
          )}

          {step === 3 && (
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Close & View Ledger
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
