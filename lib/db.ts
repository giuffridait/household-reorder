import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'household.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS household_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      status TEXT DEFAULT 'active',

      preferred_brand TEXT,
      preferred_variant TEXT,
      preferred_store TEXT,
      reorder_url TEXT,

      usage_type TEXT DEFAULT 'fixed_interval',
      reorder_interval_days INTEGER,
      buffer_days INTEGER DEFAULT 3,

      last_ordered_at DATE,
      next_reorder_at DATE,

      agent_notes TEXT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS household_events (
      id TEXT PRIMARY KEY,
      item_id TEXT REFERENCES household_items(id),
      event_type TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data TEXT
    );
  `);
}
