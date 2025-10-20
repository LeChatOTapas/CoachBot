const path = require("path");
const Database = require("better-sqlite3");

// Use data directory for persistent storage (mounted volume in Dokploy)
const dbFile = path.resolve("data/coachbot.sqlite");

console.log("Opening SQLite database at:", dbFile);
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
