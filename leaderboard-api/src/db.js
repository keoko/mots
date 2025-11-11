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
`);

console.log('✓ Database initialized');

export default db;
