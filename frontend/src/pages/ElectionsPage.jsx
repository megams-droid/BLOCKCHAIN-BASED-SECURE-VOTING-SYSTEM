import React, { useState } from 'react';
import { Vote, Calendar, Users, CheckCircle2, AlertCircle, ArrowRight, BarChart3, ShieldCheck, Lock } from 'lucide-react';

export default function ElectionsPage({
  elections,
  currentUser,
  onSelectElectionForVote,
  onSelectElectionForResults,
  onSelectElectionForExplorer,
  onSelectElectionForVerification,
}) {
  const [filter, setFilter] = useState('all');

  const filteredElections = elections.filter((e) => {
    if (filter === 'active') return e.election_status === 'active';
    if (filter === 'upcoming') return e.election_status === 'upcoming';
    if (filter === 'closed') return e.election_status === 'closed';
    return true;
  });

  return (
    <div className="container" style={{ padding: '36px 24px 60px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Elections Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Browse active ballots, verify your eligibility, and participate in cryptographic elections.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {['all', 'active', 'upcoming', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filter === f ? '#ffffff' : 'transparent',
                color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: filter === f ? '600' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: filter === f ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredElections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <AlertCircle size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ marginBottom: '8px' }}>No elections found</h3>
          <p style={{ color: 'var(--text-muted)' }}>There are no elections matching the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredElections.map((election) => {
            const isActive = election.election_status === 'active';
            const isClosed = election.election_status === 'closed';
            const hasVoted = Boolean(election.current_user_has_voted);
            const isEligible = Boolean(election.current_user_eligible);

            return (
              <div key={election.election_id} className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span
                        className={`badge ${
                          isActive ? 'badge-active' : isClosed ? 'badge-closed' : 'badge-upcoming'
                        }`}
                      >
                        {election.election_status}
                      </span>

                      {/* Voter Personal Status */}
                      {currentUser && currentUser.role === 'voter' && (
                        <>
                          {hasVoted ? (
                            <span className="badge badge-success">
                              <CheckCircle2 size={12} /> Ballot Recorded on Chain
                            </span>
                          ) : isEligible ? (
                            <span className="badge badge-active">
                              <Vote size={12} /> Eligible to Vote
                            </span>
                          ) : (
                            <span className="badge badge-closed">Not Enrolled</span>
                          )}
                        </>
                      )}

                      {election.results_published ? (
                        <span className="badge badge-success">Results Certified & Published</span>
                      ) : null}
                    </div>

                    <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{election.election_name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '720px' }}>
                      {election.description}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      <span>
                        {new Date(election.start_time).toLocaleDateString()} — {new Date(election.end_time).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', justifyContent: 'flex-end' }}>
                      <Users size={14} />
                      <span>{election.candidate_count || 0} Candidates Nominated</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '18px',
                    marginTop: '8px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Total Ballots Cast: <strong>{election.total_votes_cast || 0}</strong></span>
                    <span>•</span>
                    <span>Turnout: <strong>{election.eligible_voters_count > 0 ? ((election.total_votes_cast / election.eligible_voters_count) * 100).toFixed(1) : 0}%</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Vote Button */}
                    {isActive && (
                      <button
                        className="btn btn-primary"
                        onClick={() => onSelectElectionForVote(election)}
                        disabled={hasVoted}
                      >
                        {hasVoted ? (
                          <>
                            <CheckCircle2 size={16} /> Vote Cast
                          </>
                        ) : (
                          <>
                            <Vote size={16} /> Cast Secure Ballot
                          </>
                        )}
                      </button>
                    )}

                    {/* Results Button */}
                    <button
                      className="btn btn-outline"
                      onClick={() => onSelectElectionForResults(election.election_id)}
                    >
                      <BarChart3 size={15} /> Results
                    </button>

                    {/* Blockchain Explorer Button */}
                    <button
                      className="btn btn-outline"
                      onClick={() => onSelectElectionForExplorer(election.election_id)}
                    >
                      <ShieldCheck size={15} color="#0d9488" /> Blockchain Ledger
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
