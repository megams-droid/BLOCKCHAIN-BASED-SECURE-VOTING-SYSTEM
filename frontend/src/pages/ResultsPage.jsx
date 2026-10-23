import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  BarChart3,
  Trophy,
  Users,
  CheckCircle2,
  Lock,
  Vote,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function ResultsPage({ elections, selectedElectionId, currentUser, onNavigate }) {
  const [activeId, setActiveId] = useState(selectedElectionId || (elections[0]?.election_id || 1));
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeId) {
      loadResults(activeId);
    }
  }, [activeId]);

  const loadResults = async (id) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getResults(id);
      setResultsData(data);
    } catch (err) {
      setError('Unable to load election results.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!resultsData) return;
    try {
      await api.updateElectionStatus(activeId, undefined, !resultsData.results_published);
      loadResults(activeId);
    } catch (err) {
      alert('Failed to update publication status.');
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px 60px 24px' }}>
      {/* Header & Election Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Election Results & Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Live certified tally computed using SQL aggregations directly over the blockchain-backed votes table.
          </p>
        </div>

        {/* Election Dropdown Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Election:
          </label>
          <select
            value={activeId}
            onChange={(e) => setActiveId(Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto', minWidth: '260px' }}
          >
            {elections.map((el) => (
              <option key={el.election_id} value={el.election_id}>
                {el.election_name} ({el.election_status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Calculating results from database records...</div>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px auto' }} />
          <div>{error}</div>
        </div>
      ) : !resultsData?.results_published && currentUser?.role !== 'admin' ? (
        /* Results Sealed State */
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: 'var(--text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Results Sealed</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.5' }}>
            Official results for <strong>{resultsData?.election_name}</strong> are withheld until the election concludes and publication is certified by the Chief Election Officer.
          </p>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
            Status: <span className="badge badge-active">{resultsData?.election_status}</span>
          </div>
        </div>
      ) : (
        /* Published / Admin Preview Results */
        <div>
          {/* Admin Notice Banner if viewing unpublished results */}
          {!resultsData?.results_published && currentUser?.role === 'admin' && (
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '0.88rem' }}>
                <Eye size={18} />
                <span>
                  <strong>Admin Preview Mode:</strong> Results are currently unpublished to the general electorate.
                </span>
              </div>
              <button className="btn btn-sm btn-primary" onClick={handlePublishToggle}>
                Publish Results Publicly
              </button>
            </div>
          )}

          {/* Top KPI Cards */}
          <div className="grid-3" style={{ marginBottom: '28px' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: '600', marginBottom: '8px' }}>
                <Vote size={18} color="#0284c7" />
                <span>TOTAL VOTES CAST</span>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--navy-dark)' }}>
                {resultsData.total_votes_cast}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '4px' }}>
                Recorded & linked on SHA-256 blocks
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: '600', marginBottom: '8px' }}>
                <Users size={18} color="#0d9488" />
                <span>ELECTORATE TURNOUT</span>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--teal)' }}>
                {resultsData.turnout_percentage}%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '4px' }}>
                {resultsData.voters_participated} of {resultsData.eligible_voters} eligible voters participated
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: '600', marginBottom: '8px' }}>
                <Trophy size={18} color="#f59e0b" />
                <span>PROJECTED WINNER</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--navy-dark)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {resultsData.winner ? resultsData.winner.candidate_name : 'No Votes Recorded'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '600', marginTop: '4px' }}>
                {resultsData.winner ? resultsData.winner.party_or_group : 'Awaiting ballots'}
              </div>
            </div>
          </div>

          {/* Candidate Standings & Visual Chart */}
          <div className="card" style={{ padding: '30px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Candidate Vote Standings</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Derived via SQL Query: <code>GROUP BY candidate_id ORDER BY total_votes DESC</code>
                </p>
              </div>
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> Certified Tally
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {resultsData.candidate_standings?.map((candidate, idx) => (
                <div key={candidate.candidate_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: idx === 0 ? '#fef3c7' : '#f1f5f9',
                          color: idx === 0 ? '#b45309' : 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '1rem', color: 'var(--navy-dark)' }}>
                        {candidate.candidate_name}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        ({candidate.party_or_group})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {candidate.total_votes} votes
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', minWidth: '45px', textAlign: 'right' }}>
                        {candidate.vote_percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar in Light Mode */}
                  <div
                    style={{
                      height: '10px',
                      background: '#f1f5f9',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${candidate.vote_percentage}%`,
                        background:
                          idx === 0
                            ? 'linear-gradient(90deg, #0284c7 0%, #0d9488 100%)'
                            : 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)',
                        borderRadius: '9999px',
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
