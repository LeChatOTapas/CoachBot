const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dbFile = path.join(__dirname, "coachbot.sqlite");

// Ensure directory exists (it does from create_directory), and DB file will be created automatically
const db = new Database(dbFile);

db.pragma("journal_mode = WAL"); // better concurrency

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  discord_id TEXT PRIMARY KEY,
  username TEXT,
  status TEXT CHECK(status in ('waiting','connected')) NOT NULL DEFAULT 'waiting',
  coachfoot_id TEXT,
  pseudo TEXT,
  players_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Trigger to update updated_at on change
try {
  db.exec(`
  CREATE TRIGGER IF NOT EXISTS users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE discord_id = OLD.discord_id;
  END;
  `);
} catch (_) {}

module.exports = db;
