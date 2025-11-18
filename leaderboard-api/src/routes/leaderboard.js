// routes/leaderboard.js - Leaderboard API endpoints
import express from 'express';
import db from '../db.js';

const router = express.Router();

// Allowed topic IDs - matches production topics + dev-short for testing
const ALLOWED_TOPICS = new Set([
  'cosmetics',
  'infancy',
  'pregnancy',
  'toiletries',
  'dev-short'
]);

// GET /api/leaderboard/:topicId - Get top 10 best scores per player for a topic
router.get('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;

    // Validate topic ID
    if (!ALLOWED_TOPICS.has(topicId)) {
      return res.status(400).json({ error: 'Invalid topic ID' });
    }

    // Get best score per player (player_id), showing only top 10 unique players
    const result = await db.execute({
      sql: `
        SELECT
          id,
          player_id as playerId,
          player_name as playerName,
          score,
          words_won as wordsWon,
          words_lost as wordsLost,
          success_rate as successRate,
          time,
          created_at as date
        FROM scores
        WHERE topic_id = ?
          AND id IN (
            SELECT id
            FROM scores s2
            WHERE s2.topic_id = ?
              AND s2.player_id = scores.player_id
            ORDER BY s2.score DESC, s2.time ASC
            LIMIT 1
          )
        ORDER BY score DESC, time ASC
        LIMIT 10
      `,
      args: [topicId, topicId]
    });

    res.json({
      topicId,
      scores: result.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/leaderboard/:topicId - Submit a score
router.post('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { playerId, playerName, score, wordsWon, wordsLost, successRate, time } = req.body;

    // Validate topic ID
    if (!ALLOWED_TOPICS.has(topicId)) {
      return res.status(400).json({ error: 'Invalid topic ID' });
    }

    // Validation
    if (!playerName || playerName.length > 8) {
      return res.status(400).json({ error: 'Player name required (max 8 chars)' });
    }

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    if (score > 10000) {
      return res.status(400).json({ error: 'Score too high (max 10000)' });
    }

    if (typeof time !== 'number' || time < 0) {
      return res.status(400).json({ error: 'Invalid time' });
    }

    // Insert score
    const insertResult = await db.execute({
      sql: `
        INSERT INTO scores (topic_id, player_id, player_name, score, words_won, words_lost, success_rate, time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        topicId,
        playerId || null,
        playerName,
        score,
        wordsWon || 0,
        wordsLost || 0,
        successRate || 0,
        time
      ]
    });

    // Calculate rank among unique players (based on their best scores)
    const rankResult = await db.execute({
      sql: `
        WITH player_best_scores AS (
          SELECT
            player_id,
            MAX(score) as best_score,
            MIN(time) as best_time
          FROM scores
          WHERE topic_id = ?
            AND player_id IS NOT NULL
          GROUP BY player_id
        )
        SELECT COUNT(*) + 1 as rank
        FROM player_best_scores
        WHERE best_score > ? OR (best_score = ? AND best_time < ?)
      `,
      args: [topicId, score, score, time]
    });

    const rank = rankResult.rows[0]?.rank || 1;

    // Get top 10 unique players
    const topResult = await db.execute({
      sql: `
        SELECT
          id,
          player_id as playerId,
          player_name as playerName,
          score,
          success_rate as successRate,
          time,
          created_at as date
        FROM scores
        WHERE topic_id = ?
          AND id IN (
            SELECT id
            FROM scores s2
            WHERE s2.topic_id = ?
              AND s2.player_id = scores.player_id
            ORDER BY s2.score DESC, s2.time ASC
            LIMIT 1
          )
        ORDER BY score DESC, time ASC
        LIMIT 10
      `,
      args: [topicId, topicId]
    });

    res.json({
      id: Number(insertResult.lastInsertRowid),
      rank,
      madeTopTen: rank <= 10,
      topScores: topResult.rows
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

export default router;
