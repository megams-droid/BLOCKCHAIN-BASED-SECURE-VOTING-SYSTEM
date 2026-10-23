import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { initDatabase } from './config/db.js';
import { authenticate } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup allowing credentials from frontend
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(authenticate);

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Blockchain-Based Secure Voting System',
    timestamp: new Date().toISOString(),
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize database schema, views, and seed data
initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Blockchain Secure Voting Backend running at http://localhost:${PORT}`);
  console.log(`🔒 Relational DBMS & Cryptographic Ledger initialized.`);
});

export default app;
