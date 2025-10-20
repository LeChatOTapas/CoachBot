const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// Use /data directory for persistent storage, separate from code
const dataDir = "/data";
const dbFile = path.join(dataDir, "coachbot.sqlite");

// Debug: log paths and permissions
console.log("DB directory:", dataDir);
console.log("DB file path:", dbFile);

// Ensure directory exists and is writable
try {
  if (!fs.existsSync(dataDir)) {
    console.log("Creating data directory...");
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Test write permissions
  fs.accessSync(dataDir, fs.constants.W_OK);
  console.log("Data directory is writable");

  // Check if DB file already exists
  if (fs.existsSync(dbFile)) {
    console.log("DB file already exists");
    const stats = fs.statSync(dbFile);
    console.log("DB file size:", stats.size, "bytes");
    console.log("DB file permissions:", stats.mode.toString(8));
  } else {
    console.log("DB file does not exist, will be created");
  }

  // Test creating a simple test file in the directory
  const testFile = path.join(dataDir, "test.tmp");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
  console.log("Test file creation successful");
} catch (error) {
  console.error("Data directory/file error:", error.message);
  throw error;
}

console.log("Opening SQLite database...");
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
