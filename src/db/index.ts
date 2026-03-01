import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath = path.join(process.cwd(), 'buddy-recall.db');
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Initialize tables
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#e2e8f0',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      analogy TEXT,
      card_type TEXT DEFAULT 'definition',
      visual_reference TEXT,
      difficulty INTEGER DEFAULT 3,
      due_date TEXT DEFAULT CURRENT_TIMESTAMP,
      interval INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      review_count INTEGER DEFAULT 0,
      recall_success_rate REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      response_time_ms INTEGER,
      reviewed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      deck_id INTEGER,
      card_id INTEGER,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      score_percent REAL NOT NULL,
      time_taken_ms INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      card_id INTEGER NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
      user_answer TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL
    );
  `);

  // Migration: add topic_id column to existing flashcards table if missing
  const cols = sqlite.prepare("PRAGMA table_info(flashcards)").all() as { name: string }[];
  if (!cols.some((c) => c.name === 'topic_id')) {
    sqlite.exec('ALTER TABLE flashcards ADD COLUMN topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL');
  }

  // Migration: add analogy column to existing flashcards table if missing
  const cols2 = sqlite.prepare("PRAGMA table_info(flashcards)").all() as { name: string }[];
  if (!cols2.some((c) => c.name === 'analogy')) {
    sqlite.exec('ALTER TABLE flashcards ADD COLUMN analogy TEXT');
  }
}

initializeDatabase();

export default db;
