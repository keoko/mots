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

// Maximum number of scores to keep per topic (prevents database bloat)
const MAX_SCORES_PER_TOPIC = 100;

// In-memory cache of player counts per topic (reduces DB queries)
// Single instance on Fly.io free tier makes this safe
const topicPlayerCounts = new Map();

// Initialize counts on startup
async function initializeTopicCounts() {
  try {
    for (const topicId of ALLOWED_TOPICS) {
      const result = await db.execute({
        sql: `SELECT COUNT(*) as count FROM scores WHERE topic_id = ?`,
        args: [topicId]
      });
      const count = result.rows[0]?.count || 0;
      topicPlayerCounts.set(topicId, count);
    }
    console.log('✓ Topic counts initialized:', Object.fromEntries(topicPlayerCounts));
  } catch (error) {
    console.error('Failed to initialize topic counts:', error);
  }
}

// Initialize counts when module loads
await initializeTopicCounts();

// GET /api/leaderboard/:topicId - Get top 10 scores for a topic
router.get('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;

    // Validate topic ID
    if (!ALLOWED_TOPICS.has(topicId)) {
      return res.status(400).json({ error: 'Invalid topic ID' });
    }

    // Simple query - one score per player, get top 10
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
        ORDER BY score DESC, time ASC
        LIMIT 10
      `,
      args: [topicId]
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

// POST /api/leaderboard/:topicId - Submit a score (only if better than existing)
router.post('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { playerId, playerName, score, wordsWon, wordsLost, successRate, time } = req.body;

    // Validate topic ID
    if (!ALLOWED_TOPICS.has(topicId)) {
      return res.status(400).json({ error: 'Invalid topic ID' });
    }

    // Validation
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID required' });
    }

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

    // Check if player already has a score for this topic
    const existingResult = await db.execute({
      sql: `SELECT id, score, time FROM scores WHERE player_id = ? AND topic_id = ?`,
      args: [playerId, topicId]
    });

    const existing = existingResult.rows[0];
    let recordId;
    let updated = false;

    if (existing) {
      // Existing player - allow update if better score
      const isBetterScore = score > existing.score || (score === existing.score && time < existing.time);

      if (isBetterScore) {
        await db.execute({
          sql: `
            UPDATE scores
            SET score = ?, words_won = ?, words_lost = ?, success_rate = ?, time = ?,
                player_name = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
          args: [score, wordsWon || 0, wordsLost || 0, successRate || 0, time, playerName, existing.id]
        });
        recordId = existing.id;
        updated = true;
      } else {
        recordId = existing.id;
        updated = false;
      }
    } else {
      // New player - check if topic has room (using in-memory cache)
      const count = topicPlayerCounts.get(topicId) || 0;

      if (count >= MAX_SCORES_PER_TOPIC) {
        return res.status(400).json({ error: 'Leaderboard full. Try another topic!' });
      }

      // Insert new player
      const insertResult = await db.execute({
        sql: `
          INSERT INTO scores (topic_id, player_id, player_name, score, words_won, words_lost, success_rate, time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [topicId, playerId, playerName, score, wordsWon || 0, wordsLost || 0, successRate || 0, time]
      });
      recordId = Number(insertResult.lastInsertRowid);
      updated = true;

      // Increment in-memory count
      const newCount = count + 1;
      topicPlayerCounts.set(topicId, newCount);
      console.log(`✓ New player added to ${topicId}: ${playerName} (${newCount}/${MAX_SCORES_PER_TOPIC})`);
    }

    // Calculate rank (simple count)
    const rankResult = await db.execute({
      sql: `
        SELECT COUNT(*) + 1 as rank
        FROM scores
        WHERE topic_id = ?
          AND (score > ? OR (score = ? AND time < ?))
      `,
      args: [topicId, score, score, time]
    });

    const rank = rankResult.rows[0]?.rank || 1;

    // Get top 10
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
        ORDER BY score DESC, time ASC
        LIMIT 10
      `,
      args: [topicId]
    });

    res.json({
      id: recordId,
      rank,
      madeTopTen: rank <= 10,
      updated, // True if score was saved/updated, false if existing was better
      topScores: topResult.rows
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

export default router;
