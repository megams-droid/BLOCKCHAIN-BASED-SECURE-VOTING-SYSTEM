import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { User, FileText, CheckCircle2, AlertCircle, Save, Vote, BarChart3 } from 'lucide-react';

export default function CandidatePortalPage({ currentUser, elections, onNavigate }) {
  const [candidates, setCandidates] = useState([]);
  const [manifestoText, setManifestoText] = useState('');
  const [partyText, setPartyText] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCandidateProfile();
  }, [currentUser]);

  const loadCandidateProfile = async () => {
    try {
      // Find candidate entries linked to this user
      const allCands = [];
      for (const el of elections) {
        const data = await api.getCandidates(el.election_id);
        const myEntries = (data.candidates || []).filter((c) => c.user_id === currentUser.user_id);
        allCands.push(...myEntries);
      }
      setCandidates(allCands);
      if (allCands.length > 0) {
        setSelectedCandidateId(allCands[0].candidate_id);
        setManifestoText(allCands[0].manifesto || '');
        setPartyText(allCands[0].party_or_group || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId) return;

    setSaving(true);
    setMessage('');
    try {
      await api.updateCandidate(selectedCandidateId, {
        manifesto: manifestoText,
        party_or_group: partyText,
      });
      setMessage('✅ Candidate profile and manifesto updated successfully!');
    } catch (err) {
      setMessage('❌ Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ padding: '36px 24px 60px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-upcoming" style={{ fontSize: '0.72rem' }}>
              CANDIDATE DASHBOARD
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', marginTop: '4px', marginBottom: '4px' }}>Candidate Campaign Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage your candidacy statement, review verified election schedules, and monitor published results.
          </p>
        </div>

        <button className="btn btn-outline" onClick={() => onNavigate('results')}>
          <BarChart3 size={16} /> View Election Standings
        </button>
      </div>

      {message && (
        <div
          style={{
            background: message.includes('✅') ? 'var(--success-light)' : 'var(--danger-light)',
            border: message.includes('✅') ? '1px solid var(--success-border)' : '1px solid var(--danger-border)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            fontSize: '0.9rem',
          }}
        >
          {message}
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Profile & Manifesto Editor */}
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#0284c7" /> Edit Campaign Manifesto
          </h3>

          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">Full Legal Name</label>
              <input type="text" disabled className="form-input" value={currentUser?.full_name || ''} style={{ background: '#f8fafc' }} />
              <div className="form-help">Candidate legal name is verified upon registration and cannot be altered.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Political Party or Student Caucus</label>
              <input
                type="text"
                className="form-input"
                required
                value={partyText}
                onChange={(e) => setPartyText(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Campaign Manifesto Statement</label>
              <textarea
                rows={5}
                required
                className="form-textarea"
                placeholder="State your campaign promises, policies, and background..."
                value={manifestoText}
                onChange={(e) => setManifestoText(e.target.value)}
              />
              <div className="form-help">This statement is displayed to voters on their secret ballot.</div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save & Publish Manifesto'}
            </button>
          </form>
        </div>

        {/* Candidate Electoral Status Card */}
        <div className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Enrolled Candidacy Records</h3>

          {candidates.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No candidate records linked to your user account.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {candidates.map((c) => (
                <div key={c.candidate_id} style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--navy-dark)' }}>
                    {c.candidate_name}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '8px' }}>
                    {c.party_or_group}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Candidacy ID: <code>#{c.candidate_id}</code> • Election ID: <code>#{c.election_id}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
