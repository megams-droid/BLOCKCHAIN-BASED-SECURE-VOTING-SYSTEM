import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import ElectionsPage from './pages/ElectionsPage.jsx';
import VotingModal from './pages/VotingModal.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import BlockchainExplorerPage from './pages/BlockchainExplorerPage.jsx';
import IntegrityVerificationPage from './pages/IntegrityVerificationPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import CandidatePortalPage from './pages/CandidatePortalPage.jsx';
import SqlDemoPage from './pages/SqlDemoPage.jsx';
import VoiceAssistantModal from './components/VoiceAssistantModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import { useVoiceAssistant } from './hooks/useVoiceAssistant.js';
import { api } from './services/api.js';
import { Mic, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [elections, setElections] = useState([]);
  const [selectedElectionForVote, setSelectedElectionForVote] = useState(null);
  const [selectedElectionForResults, setSelectedElectionForResults] = useState(null);
  const [selectedElectionForExplorer, setSelectedElectionForExplorer] = useState(null);
  const [stats, setStats] = useState(null);

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Theme Management (Defaults to 'white' mode as requested)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('voting_app_theme') || 'white';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('voting_app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'white' ? 'dark' : 'white'));
  };

  // Initialize Voice Assistant Hook with theme switching capability
  const voice = useVoiceAssistant(
    (page) => {
      setCurrentPage(page);
    },
    { theme, setTheme, toggleTheme }
  );

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      // 1. Try to load authenticated user
      try {
        const me = await api.getMe();
        if (me?.user) {
          setCurrentUser(me.user);
        }
      } catch {
        // Fallback default: log in as Alex Rivera (Voter) for instant out-of-the-box experience
        try {
          const loginRes = await api.login('alex.voter@campus.edu', 'Password@123');
          setCurrentUser(loginRes.user);
        } catch (e) {
          console.warn('Auto demo login skipped:', e);
        }
      }

      // 2. Load Elections & Stats
      loadElections();
      loadStats();
    } catch (err) {
      console.error('App init error:', err);
    }
  };

  const loadElections = async () => {
    try {
      const data = await api.getElections();
      setElections(data.elections || []);
    } catch (err) {
      console.error('Failed to load elections:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getAdminDashboard();
      if (data?.metrics) {
        setStats(data.metrics);
      }
    } catch {
      // In case user is not admin, fallback stats
      setStats({
        total_registered_users: 7,
        total_elections: 2,
        total_blockchain_blocks: 5,
        is_ledger_valid: true,
      });
    }
  };

  const handleSwitchAccount = async (email) => {
    try {
      const res = await api.login(email, 'Password@123');
      setCurrentUser(res.user);
      loadElections();
      loadStats();
      voice.speak(`Switched account to ${res.user.full_name}, role: ${res.user.role}.`);
    } catch (err) {
      alert('Failed to switch persona: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  return (
    <div className="app-root">
      {/* Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentUser}
        onSwitchAccount={handleSwitchAccount}
        onLogout={handleLogout}
        onOpenVoice={() => setIsVoiceOpen(true)}
        voiceActive={voice.isListening || voice.isSpeaking}
        onOpenAuth={() => setIsAuthOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Router */}
      <main>
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={setCurrentPage}
            stats={stats}
            onOpenVoice={() => setIsVoiceOpen(true)}
          />
        )}

        {currentPage === 'elections' && (
          <ElectionsPage
            elections={elections}
            currentUser={currentUser}
            onSelectElectionForVote={(el) => setSelectedElectionForVote(el)}
            onSelectElectionForResults={(id) => {
              setSelectedElectionForResults(id);
              setCurrentPage('results');
            }}
            onSelectElectionForExplorer={(id) => {
              setSelectedElectionForExplorer(id);
              setCurrentPage('explorer');
            }}
          />
        )}

        {currentPage === 'results' && (
          <ResultsPage
            elections={elections}
            selectedElectionId={selectedElectionForResults}
            currentUser={currentUser}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'explorer' && (
          <BlockchainExplorerPage
            elections={elections}
            selectedElectionId={selectedElectionForExplorer}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'verification' && (
          <IntegrityVerificationPage
            elections={elections}
            selectedElectionId={selectedElectionForExplorer}
            onSpeak={voice.speak}
          />
        )}

        {currentPage === 'admin' && (
          <AdminDashboardPage
            elections={elections}
            onRefreshElections={loadElections}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'candidate' && (
          <CandidatePortalPage
            currentUser={currentUser}
            elections={elections}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'sqldemo' && <SqlDemoPage />}
      </main>

      {/* Floating AI Voice Assistant Button */}
      <button
        className="voice-float-btn"
        onClick={() => setIsVoiceOpen(true)}
        title="Open AI Voice Assistant"
      >
        <span className="voice-pulse-ring" />
        <Mic size={20} />
        <span>AI Voice Assistant</span>
      </button>

      {/* Voting Modal */}
      {selectedElectionForVote && (
        <VotingModal
          election={selectedElectionForVote}
          currentUser={currentUser}
          onClose={() => setSelectedElectionForVote(null)}
          onVoteSuccess={() => {
            loadElections();
            loadStats();
          }}
        />
      )}

      {/* AI Voice Assistant Drawer / Modal */}
      <VoiceAssistantModal
        voice={voice}
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          loadElections();
          loadStats();
        }}
      />
    </div>
  );
}
