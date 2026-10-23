import express from 'express';
import * as authController from '../controllers/authController.js';
import * as electionController from '../controllers/electionController.js';
import * as candidateController from '../controllers/candidateController.js';
import * as votingController from '../controllers/votingController.js';
import * as resultController from '../controllers/resultController.js';
import * as blockchainController from '../controllers/blockchainController.js';
import * as adminController from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// --- Authentication ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', requireAuth, authController.getMe);
router.get('/auth/demo-accounts', authController.getDemoAccounts);

// --- Elections ---
router.get('/elections', electionController.getElections);
router.get('/elections/:id', electionController.getElectionById);
router.post('/elections', requireAuth, requireRole(['admin']), electionController.createElection);
router.put('/elections/:id', requireAuth, requireRole(['admin']), electionController.updateElection);
router.patch('/elections/:id/status', requireAuth, requireRole(['admin']), electionController.updateStatus);

// --- Candidates ---
router.get('/elections/:id/candidates', candidateController.getCandidates);
router.post('/elections/:id/candidates', requireAuth, requireRole(['admin']), candidateController.createCandidate);
router.put('/candidates/:id', requireAuth, candidateController.updateCandidate);

// --- Voting ---
router.get('/voting/eligibility/:electionId', requireAuth, votingController.getEligibility);
router.post('/voting/cast', requireAuth, votingController.castVote);
router.get('/voting/participation/:electionId', votingController.getParticipation);

// --- Results ---
router.get('/results/:electionId', resultController.getResults);

// --- Blockchain ---
router.get('/blockchain/:electionId', blockchainController.getBlockchain);
router.get('/blockchain/:electionId/verify', blockchainController.verifyChain);
router.post('/blockchain/:electionId/tamper', requireAuth, requireRole(['admin']), blockchainController.tamperBlock);
router.post('/blockchain/:electionId/restore', requireAuth, requireRole(['admin']), blockchainController.restoreChainBlock);

// --- Administration ---
router.get('/admin/dashboard', requireAuth, requireRole(['admin']), adminController.getAdminDashboard);
router.get('/admin/audit-logs', requireAuth, requireRole(['admin']), adminController.getAuditLogs);
router.get('/admin/reports/:electionId', requireAuth, requireRole(['admin']), adminController.getElectionReport);
router.get('/admin/users', requireAuth, requireRole(['admin']), adminController.getAllUsers);
router.patch('/admin/users/:userId/status', requireAuth, requireRole(['admin']), adminController.toggleUserStatus);
router.post('/admin/voters/eligibility', requireAuth, requireRole(['admin']), adminController.toggleVoterEligibility);
router.get('/admin/sql-demo', adminController.runSqlDemo);
router.get('/admin/export/:electionId', requireAuth, requireRole(['admin']), adminController.exportCsv);

export default router;
