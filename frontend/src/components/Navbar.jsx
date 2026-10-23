import {
  Boxes,
  ShieldCheck,
  BarChart3,
  Vote,
  Database,
  Lock,
  Mic,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  Sun,
  Moon,
} from 'lucide-react';

export default function Navbar({
  currentPage,
  onNavigate,
  currentUser,
  demoAccounts,
  onSwitchAccount,
  onLogout,
  onOpenVoice,
  voiceActive,
  onOpenAuth,
  theme = 'white',
  onToggleTheme,
}) {
  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand */}
        <div className="nav-brand" onClick={() => onNavigate('landing')}>
          <div className="brand-icon">
            <Boxes size={24} />
          </div>
          <div>
            <div className="brand-title">Antigravity Vote</div>
            <div className="brand-tagline">Your Vote. Your Voice. Securely.</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="nav-links">
          <button
            className={`nav-link ${currentPage === 'landing' ? 'active' : ''}`}
            onClick={() => onNavigate('landing')}
          >
            Overview
          </button>
          <button
            className={`nav-link ${currentPage === 'elections' ? 'active' : ''}`}
            onClick={() => onNavigate('elections')}
          >
            <Vote size={16} /> Elections
          </button>
          <button
            className={`nav-link ${currentPage === 'results' ? 'active' : ''}`}
            onClick={() => onNavigate('results')}
          >
            <BarChart3 size={16} /> Results
          </button>
          <button
            className={`nav-link ${currentPage === 'explorer' ? 'active' : ''}`}
            onClick={() => onNavigate('explorer')}
          >
            <Boxes size={16} /> Explorer
          </button>
          <button
            className={`nav-link ${currentPage === 'verification' ? 'active' : ''}`}
            onClick={() => onNavigate('verification')}
          >
            <ShieldCheck size={16} /> Verify
          </button>
          <button
            className={`nav-link ${currentPage === 'sqldemo' ? 'active' : ''}`}
            onClick={() => onNavigate('sqldemo')}
          >
            <Database size={16} /> SQL Demo
          </button>

          {/* Conditional Admin Link */}
          {currentUser?.role === 'admin' && (
            <button
              className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => onNavigate('admin')}
              style={{ color: '#0d9488', fontWeight: '600' }}
            >
              <LayoutDashboard size={16} /> Admin
            </button>
          )}

          {/* Conditional Candidate Link */}
          {currentUser?.role === 'candidate' && (
            <button
              className={`nav-link ${currentPage === 'candidate' ? 'active' : ''}`}
              onClick={() => onNavigate('candidate')}
              style={{ color: '#0284c7', fontWeight: '600' }}
            >
              <User size={16} /> Portal
            </button>
          )}
        </nav>

        {/* Right Actions: Theme Toggle, AI Voice, Demo Persona Switcher, Auth */}
        <div className="nav-actions">
          {/* Theme Mode Switcher (White Mode / Dark Mode) */}
          <button
            onClick={onToggleTheme}
            className="btn btn-sm btn-outline theme-toggle-btn"
            style={{
              gap: '6px',
              padding: '6px 12px',
              borderColor: 'var(--border-light)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
            }}
            title={`Current theme: ${theme === 'white' ? 'White Mode' : 'Dark Mode'}. Click to switch theme.`}
          >
            {theme === 'white' ? (
              <>
                <Sun size={15} color="#d97706" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>White Mode</span>
              </>
            ) : (
              <>
                <Moon size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dark Mode</span>
              </>
            )}
          </button>

          {/* AI Voice Assistant Trigger */}
          <button
            onClick={onOpenVoice}
            className="btn btn-sm btn-outline"
            style={{
              borderColor: 'var(--teal-border)',
              background: 'var(--teal-light)',
              color: 'var(--teal)',
              gap: '6px',
            }}
            title="Open AI Voice Assistant"
          >
            <Mic size={15} />
            <span>AI Voice</span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#0d9488',
                display: 'inline-block',
              }}
            />
          </button>

          {/* Demo Account Switcher for Instant Viva/Testing */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={currentUser ? currentUser.email : ''}
              onChange={(e) => onSwitchAccount(e.target.value)}
              className="form-select"
              style={{
                fontSize: '0.8rem',
                padding: '6px 28px 6px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                borderColor: 'var(--border-light)',
                color: 'var(--text-main)',
                fontWeight: '500',
                cursor: 'pointer',
              }}
              title="Quickly switch demo personas"
            >
              <option value="" disabled>
                Switch Role / User ▾
              </option>
              <option value="admin@voting.gov">🛡️ Admin (Election Officer)</option>
              <option value="alex.voter@campus.edu">🗳️ Voter (Alex Rivera)</option>
              <option value="jordan.voter@campus.edu">🗳️ Voter (Jordan Lee)</option>
              <option value="elena.vance@campus.edu">👤 Candidate (Dr. Elena)</option>
              <option value="marcus.s@campus.edu">👤 Candidate (Marcus S.)</option>
            </select>
          </div>

          {/* Current User Info or Login Button */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                }}
              >
                <span
                  style={{
                    color:
                      currentUser.role === 'admin'
                        ? '#0d9488'
                        : currentUser.role === 'candidate'
                        ? '#0284c7'
                        : '#64748b',
                  }}
                >
                  {currentUser.role.toUpperCase()}
                </span>
                <span style={{ color: 'var(--text-main)' }}>{currentUser.full_name.split(' ')[0]}</span>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-sm btn-outline"
                style={{ padding: '6px 10px', color: 'var(--danger)' }}
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button className="btn btn-sm btn-primary" onClick={onOpenAuth}>
              <User size={14} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
