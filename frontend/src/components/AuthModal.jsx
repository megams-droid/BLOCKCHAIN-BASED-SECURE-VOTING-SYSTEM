import React, { useState } from 'react';
import { api } from '../services/api.js';
import { User, Lock, Mail, X, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('voter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await api.register(fullName, email, password, role);
      } else {
        res = await api.login(email, password);
      }
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.login(demoEmail, 'Password@123');
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', color: 'var(--navy-dark)' }}>
            {isRegister ? 'Register Voter / Candidate' : 'Sign In to Voting System'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: 'var(--danger)',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Persona Shortcuts */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              One-Click Demo Personas (Instant Access)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => handleQuickDemoLogin('admin@voting.gov')}
              >
                🛡️ <strong>Chief Admin</strong> (Full administrative authority)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => handleQuickDemoLogin('alex.voter@campus.edu')}
              >
                🗳️ <strong>Alex Rivera</strong> (Eligible active voter)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => handleQuickDemoLogin('elena.vance@campus.edu')}
              >
                👤 <strong>Dr. Elena Vance</strong> (Nominated candidate)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-light)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600' }}>OR ENTER CREDENTIALS</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-light)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Maya Lin"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="voter">Voter</option>
                    <option value="candidate">Candidate</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Authenticating...' : isRegister ? 'Complete Registration' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <a
                  href="#login"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRegister(false);
                  }}
                  style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}
                >
                  Sign In
                </a>
              </span>
            ) : (
              <span>
                New voter?{' '}
                <a
                  href="#register"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRegister(true);
                  }}
                  style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}
                >
                  Register here
                </a>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
