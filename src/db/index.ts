import { mkdirSync } from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";

const dbFile = path.resolve("data/coachbot.sqlite");
mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new Database(dbFile, { create: true });
db.run("PRAGMA journal_mode = WAL");

// Run migrations inline so tables exist before any module-level db.prepare() calls
db.run(`
CREATE TABLE IF NOT EXISTS users (
  discord_id   TEXT PRIMARY KEY,
  username     TEXT,
  status       TEXT CHECK(status IN ('waiting','connected')) NOT NULL DEFAULT 'waiting',
  coachfoot_id TEXT UNIQUE,
  pseudo       TEXT,
  players_json TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS link_tokens (
  token_id   TEXT PRIMARY KEY,
  discord_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0
);
`);

try {
  db.run(`
  CREATE TRIGGER IF NOT EXISTS users_updated_at
  AFTER UPDATE ON users
  FOR EACH ROW
  BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE discord_id = OLD.discord_id;
  END;
  `);
} catch (_) {}

export default db;
