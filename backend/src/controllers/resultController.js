import { db } from '../config/db.js';

export function getResults(req, res) {
  try {
    const electionId = Number(req.params.electionId);
    const userRole = req.user?.role || 'guest';

    const election = db.prepare('SELECT * FROM elections WHERE election_id = ?').get(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    // Spec Requirement: Results remain hidden until the election is closed and publication is authorized
    // (Admins can preview results before publication)
    const isAuthorized = election.results_published === 1 || userRole === 'admin';

    if (!isAuthorized) {
      return res.json({
        election_id: electionId,
        election_name: election.election_name,
        election_status: election.election_status,
        results_published: false,
        message: 'Election results are currently sealed. Results will be published after the election closes.',
      });
    }

    // Core DBMS Syllabus Query D: Candidate totals
    const candidates = db.prepare(`
      SELECT 
        c.candidate_id,
        c.candidate_name,
        c.party_or_group,
        COUNT(v.vote_id) AS total_votes
      FROM candidates c
      LEFT JOIN votes v ON c.candidate_id = v.candidate_id AND c.election_id = v.election_id
      WHERE c.election_id = ?
      GROUP BY c.candidate_id, c.candidate_name, c.party_or_group
      ORDER BY total_votes DESC
    `).all(electionId);

    // Core DBMS Syllabus Query C: Calculate turnout
    const turnoutStats = db.prepare(`
      SELECT 
        COUNT(*) AS eligible_voters,
        SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) AS voters_participated
      FROM voter_eligibility
      WHERE election_id = ? AND is_eligible = 1
    `).get(electionId);

    const totalVotesSum = candidates.reduce((sum, c) => sum + (c.total_votes || 0), 0);

    const candidateResults = candidates.map((c) => ({
      ...c,
      vote_percentage: totalVotesSum > 0 ? Number(((c.total_votes / totalVotesSum) * 100).toFixed(2)) : 0,
    }));

    const leadingCandidate = candidateResults.length > 0 && candidateResults[0].total_votes > 0 ? candidateResults[0] : null;

    return res.json({
      election_id: electionId,
      election_name: election.election_name,
      election_status: election.election_status,
      results_published: Boolean(election.results_published),
      total_votes_cast: totalVotesSum,
      eligible_voters: turnoutStats?.eligible_voters || 0,
      voters_participated: turnoutStats?.voters_participated || 0,
      turnout_percentage:
        turnoutStats?.eligible_voters > 0
          ? Number(((turnoutStats.voters_participated / turnoutStats.eligible_voters) * 100).toFixed(2))
          : 0,
      winner: leadingCandidate,
      candidate_standings: candidateResults,
      published_at: election.results_published ? election.end_time : null,
    });
  } catch (error) {
    console.error('getResults error:', error);
    return res.status(500).json({ error: 'Failed to compute election results.' });
  }
}
