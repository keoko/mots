// routes/leaderboard.js - Leaderboard API endpoints
import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/leaderboard/:topicId - Get top 10 scores for a topic
router.get('/:topicId', (req, res) => {
  try {
    const { topicId } = req.params;

    const stmt = db.prepare(`
      SELECT
        id,
        player_name as playerName,
        score,
        words_won as wordsWon,
        words_lost as wordsLost,
        success_rate as successRate,
        time,
        created_at as date
      FROM scores
      WHERE topic_id = ?
      ORDER BY score DESC, time ASC
      LIMIT 10
    `);

    const topScores = stmt.all(topicId);

    res.json({
      topicId,
      scores: topScores
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/leaderboard/:topicId - Submit a score
router.post('/:topicId', (req, res) => {
  try {
    const { topicId } = req.params;
    const { playerName, score, wordsWon, wordsLost, successRate, time } = req.body;

    // Validation
    if (!playerName || playerName.length > 8) {
      return res.status(400).json({ error: 'Player name required (max 8 chars)' });
    }

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    if (typeof time !== 'number' || time < 0) {
      return res.status(400).json({ error: 'Invalid time' });
    }

    // Insert score
    const insertStmt = db.prepare(`
      INSERT INTO scores (topic_id, player_name, score, words_won, words_lost, success_rate, time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      topicId,
      playerName,
      score,
      wordsWon || 0,
      wordsLost || 0,
      successRate || 0,
      time
    );

    // Calculate rank
    const rankStmt = db.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM scores
      WHERE topic_id = ? AND (
        score > ? OR (score = ? AND time < ?)
      )
    `);

    const { rank } = rankStmt.get(topicId, score, score, time);

    // Get top 10
    const topStmt = db.prepare(`
      SELECT
        id,
        player_name as playerName,
        score,
        success_rate as successRate,
        time,
        created_at as date
      FROM scores
      WHERE topic_id = ?
      ORDER BY score DESC, time ASC
      LIMIT 10
    `);

    const topScores = topStmt.all(topicId);

    res.json({
      id: result.lastInsertRowid,
      rank,
      madeTopTen: rank <= 10,
      topScores
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

export default router;
