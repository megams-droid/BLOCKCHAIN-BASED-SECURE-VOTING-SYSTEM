const API_BASE = '/api';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('voting_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
    credentials: 'include',
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server responded with status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('voting_auth_token', data.token);
    }
    return data;
  },
  register: async (full_name, email, password, role) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, role }),
    });
    if (data.token) {
      localStorage.setItem('voting_auth_token', data.token);
    }
    return data;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('voting_auth_token');
    }
  },
  getMe: () => request('/auth/me'),
  getDemoAccounts: () => request('/auth/demo-accounts'),

  // Elections
  getElections: () => request('/elections'),
  getElectionById: (id) => request(`/elections/${id}`),
  createElection: (data) => request('/elections', { method: 'POST', body: JSON.stringify(data) }),
  updateElectionStatus: (id, status, results_published) =>
    request(`/elections/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, results_published }) }),

  // Candidates
  getCandidates: (electionId) => request(`/elections/${electionId}/candidates`),
  createCandidate: (electionId, data) => request(`/elections/${electionId}/candidates`, { method: 'POST', body: JSON.stringify(data) }),
  updateCandidate: (candidateId, data) => request(`/candidates/${candidateId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Voting
  getEligibility: (electionId) => request(`/voting/eligibility/${electionId}`),
  castVote: (election_id, candidate_id) => request('/voting/cast', { method: 'POST', body: JSON.stringify({ election_id, candidate_id }) }),
  getParticipation: (electionId) => request(`/voting/participation/${electionId}`),

  // Results
  getResults: (electionId) => request(`/results/${electionId}`),

  // Blockchain
  getBlockchain: (electionId) => request(`/blockchain/${electionId}`),
  verifyBlockchain: (electionId) => request(`/blockchain/${electionId}/verify`),
  simulateTamper: (electionId, block_id, forged_hash) =>
    request(`/blockchain/${electionId}/tamper`, { method: 'POST', body: JSON.stringify({ block_id, forged_hash }) }),
  restoreBlock: (electionId, block_id) =>
    request(`/blockchain/${electionId}/restore`, { method: 'POST', body: JSON.stringify({ block_id }) }),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAuditLogs: (limit = 50) => request(`/admin/audit-logs?limit=${limit}`),
  getElectionReport: (electionId) => request(`/admin/reports/${electionId}`),
  getAllUsers: () => request('/admin/users'),
  toggleUserStatus: (userId, status) => request(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  toggleVoterEligibility: (voter_id, election_id, is_eligible) =>
    request('/admin/voters/eligibility', { method: 'POST', body: JSON.stringify({ voter_id, election_id, is_eligible }) }),
  getSqlDemo: () => request('/admin/sql-demo'),
};
