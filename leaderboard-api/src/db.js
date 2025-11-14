// db.js - SQLite database setup
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Use /data for production (mounted volume), or local path for development
const dbPath = process.env.NODE_ENV === 'production'
  ? '/data/leaderboard.db'
  : join(__dirname, '..', 'leaderboard.db');

// Initialize database
const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // Better concurrency

// Create scores table
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id TEXT NOT NULL,
    player_id TEXT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    words_won INTEGER NOT NULL,
    words_lost INTEGER NOT NULL,
    success_rate INTEGER NOT NULL,
    time INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_topic_score
  ON scores(topic_id, score DESC, time ASC);

  CREATE INDEX IF NOT EXISTS idx_player_topic
  ON scores(player_id, topic_id, score DESC);
`);

// Migration: Add player_id column if it doesn't exist
try {
  const columns = db.prepare("PRAGMA table_info(scores)").all();
  const hasPlayerId = columns.some(col => col.name === 'player_id');

  if (!hasPlayerId) {
    console.log('⚙️  Migrating database: adding player_id column...');
    db.exec('ALTER TABLE scores ADD COLUMN player_id TEXT');
    console.log('✓ Migration complete');
  }
} catch (error) {
  console.error('Migration error:', error);
}

console.log('✓ Database initialized');

export default db;
