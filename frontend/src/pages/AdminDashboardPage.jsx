import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Users,
  Vote,
  Boxes,
  ShieldCheck,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Lock,
  Eye,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboardPage({ elections, onRefreshElections, onNavigate }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, elections, voters, audit

  // Create election modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newElection, setNewElection] = useState({
    election_name: '',
    description: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    election_status: 'active',
  });

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [dash, users, logs] = await Promise.all([
        api.getAdminDashboard(),
        api.getAllUsers(),
        api.getAuditLogs(30),
      ]);
      setDashboardData(dash);
      setUsersList(users.users || []);
      setAuditLogs(logs.logs || []);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (electionId, newStatus) => {
    try {
      await api.updateElectionStatus(electionId, newStatus);
      if (onRefreshElections) onRefreshElections();
      loadAllAdminData();
    } catch (err) {
      alert('Failed to update election status: ' + err.message);
    }
  };

  const handlePublishToggle = async (electionId, currentPublished) => {
    try {
      await api.updateElectionStatus(electionId, undefined, !currentPublished);
      if (onRefreshElections) onRefreshElections();
      loadAllAdminData();
    } catch (err) {
      alert('Failed to toggle results publication: ' + err.message);
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      await api.createElection(newElection);
      setShowCreateModal(false);
      setNewElection({
        election_name: '',
        description: '',
        start_time: new Date().toISOString().slice(0, 16),
        end_time: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
        election_status: 'active',
      });
      if (onRefreshElections) onRefreshElections();
      loadAllAdminData();
    } catch (err) {
      alert('Failed to create election: ' + err.message);
    }
  };

  const handleCsvExport = (electionId) => {
    window.open(`/api/admin/export/${electionId}`, '_blank');
  };

  const metrics = dashboardData?.metrics;

  return (
    <div className="container" style={{ padding: '36px 24px 60px 24px' }}>
      {/* Admin Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-active" style={{ fontSize: '0.72rem' }}>
              CHIEF ELECTION OFFICER
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', marginTop: '4px', marginBottom: '4px' }}>Administrator Command Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Comprehensive management of elections, voter enrollment, cryptographic audits, and CSV reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={loadAllAdminData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Election
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
        {[
          { key: 'overview', label: 'Dashboard Overview' },
          { key: 'elections', label: 'Manage Elections' },
          { key: 'voters', label: 'Voter Registry' },
          { key: 'audit', label: 'System Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none',
              fontWeight: activeTab === tab.key ? '700' : '500',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Metrics Grid */}
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            <div className="card">
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                TOTAL REGISTERED VOTERS
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--navy-dark)', marginTop: '4px' }}>
                {metrics?.total_voters || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>
                {metrics?.total_registered_users || 0} total system users
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                VOTER TURNOUT RATE
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--teal)', marginTop: '4px' }}>
                {metrics?.overall_turnout_percentage || 0}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>
                Across all registered ballots
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ACTIVE ELECTIONS
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#6366f1', marginTop: '4px' }}>
                {metrics?.active_elections || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>
                {metrics?.closed_elections || 0} completed & sealed
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                BLOCKCHAIN STATUS
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: metrics?.is_ledger_valid ? '#10b981' : '#ef4444',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={22} /> {metrics?.is_ledger_valid ? 'LEDGER VERIFIED' : 'TAMPER DETECTED'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>
                {metrics?.total_blockchain_blocks || 0} SHA-256 blocks mined
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ELECTIONS MANAGEMENT */}
      {activeTab === 'elections' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Election Management</h3>
            <button className="btn btn-sm btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={15} /> Add New Election
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Election Name</th>
                  <th>Status</th>
                  <th>Votes Cast</th>
                  <th>Results Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((el) => (
                  <tr key={el.election_id}>
                    <td>#{el.election_id}</td>
                    <td>
                      <strong>{el.election_name}</strong>
                    </td>
                    <td>
                      <select
                        value={el.election_status}
                        onChange={(e) => handleStatusChange(el.election_id, e.target.value)}
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="upcoming">upcoming</option>
                        <option value="active">active</option>
                        <option value="closed">closed</option>
                      </select>
                    </td>
                    <td>{el.total_votes_cast || 0}</td>
                    <td>
                      <button
                        onClick={() => handlePublishToggle(el.election_id, el.results_published)}
                        className={`btn btn-sm ${el.results_published ? 'btn-teal' : 'btn-outline'}`}
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        {el.results_published ? 'Published (Public)' : 'Sealed (Click to Publish)'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleCsvExport(el.election_id)}
                        className="btn btn-sm btn-outline"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        title="Download CSV election summary"
                      >
                        <Download size={13} /> Export CSV
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VOTERS REGISTRY */}
      {activeTab === 'voters' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Enrolled Voters & System Accounts</h3>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Voter Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.user_id}>
                    <td>#{u.user_id}</td>
                    <td>
                      <strong>{u.full_name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge badge-upcoming" style={{ fontSize: '0.7rem' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="hash-pill" style={{ fontSize: '0.75rem' }}>
                        {u.voter_reference || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        {u.account_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Immutable System Audit Trail</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Demonstrates Syllabus Query F (Relational JOIN between <code>audit_logs</code> and <code>users</code>).
              </p>
            </div>
            <span className="badge badge-active">{auditLogs.length} Records</span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.log_id}>
                    <td>#{log.log_id}</td>
                    <td>
                      <strong style={{ color: '#0284c7', fontSize: '0.8rem' }}>{log.action_type}</strong>
                    </td>
                    <td>{log.entity_type}</td>
                    <td>{log.actor_name || 'System Auto'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem' }}>Create New Election</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateElection}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Election Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. 2026 Faculty Senate General Election"
                    value={newElection.election_name}
                    onChange={(e) => setNewElection({ ...newElection, election_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Scope</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Describe the electoral scope and candidates..."
                    value={newElection.description}
                    onChange={(e) => setNewElection({ ...newElection, description: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-input"
                      value={newElection.start_time}
                      onChange={(e) => setNewElection({ ...newElection, start_time: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-input"
                      value={newElection.end_time}
                      onChange={(e) => setNewElection({ ...newElection, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select
                    className="form-select"
                    value={newElection.election_status}
                    onChange={(e) => setNewElection({ ...newElection, election_status: e.target.value })}
                  >
                    <option value="active">Active (Voting Enabled)</option>
                    <option value="upcoming">Upcoming (Draft Mode)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Deploy Election & Genesis Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
