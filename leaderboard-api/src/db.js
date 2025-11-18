// db.js - Turso (libSQL) database setup
import { createClient } from '@libsql/client';

// Environment variables for Turso
const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL) {
  console.error('❌ TURSO_URL environment variable is required');
  process.exit(1);
}

// Create Turso client
const db = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN, // Optional for local dev
});

// Initialize database schema
async function initializeDatabase() {
  try {
    // Create scores table - one best score per player per topic
    await db.execute(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        words_won INTEGER NOT NULL,
        words_lost INTEGER NOT NULL,
        success_rate INTEGER NOT NULL,
        time INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, topic_id)
      )
    `);

    // Simple index for leaderboard queries
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_topic_score
      ON scores(topic_id, score DESC, time ASC)
    `);

    console.log('✓ Turso database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Initialize on module load
await initializeDatabase();

export default db;
