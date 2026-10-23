import { db } from '../config/db.js';

/**
 * Logs an action to the audit_logs table
 * Sanitizes input to guarantee sensitive data like passwords or secret votes are never recorded
 */
export function logAudit({ actor_user_id = null, action_type, entity_type, entity_reference = null, details = null }) {
  try {
    let cleanDetails = details;
    if (typeof cleanDetails === 'object' && cleanDetails !== null) {
      // Remove sensitive keys
      const safeObj = { ...cleanDetails };
      delete safeObj.password;
      delete safeObj.password_hash;
      delete safeObj.token;
      delete safeObj.secret;
      delete safeObj.vote_choice;
      delete safeObj.candidate_id; // Preserve ballot secrecy!
      cleanDetails = JSON.stringify(safeObj);
    } else if (typeof cleanDetails === 'string') {
      // Mask any potential password strings
      cleanDetails = cleanDetails.replace(/password[:=]\s*[^\s,]+/gi, 'password=***');
    }

    const stmt = db.prepare(`
      INSERT INTO audit_logs (actor_user_id, action_type, entity_type, entity_reference, details)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(actor_user_id, action_type, entity_type, entity_reference, cleanDetails);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
