const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'monetrix.db'));
db.pragma('journal_mode = WAL');

const schema = `
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  stage TEXT,
  region TEXT,
  potential_liquidity TEXT,
  confidence TEXT,
  expected_timing TEXT,
  owner TEXT,
  next_action TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS launch_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_name TEXT NOT NULL,
  workstream TEXT,
  owner TEXT,
  status TEXT,
  priority TEXT,
  risk_level TEXT,
  due_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invite_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_name TEXT NOT NULL,
  source TEXT,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  status TEXT,
  expires_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  narrative TEXT,
  channels TEXT,
  owner TEXT,
  status TEXT,
  launch_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kol_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  handle TEXT,
  platform TEXT,
  category TEXT,
  region TEXT,
  audience TEXT,
  contact_person TEXT,
  stage TEXT,
  rate_card TEXT,
  deliverable TEXT,
  publish_date TEXT,
  blockers TEXT,
  last_contact_at TEXT,
  next_action TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(schema);

function hasRows(table) {
  return db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count > 0;
}

if (!hasRows('leads')) {
  const stmt = db.prepare(`INSERT INTO leads (name, type, stage, region, potential_liquidity, confidence, expected_timing, owner, next_action, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Aether Ventures', 'VC', 'New', 'Global', '$2.5M - $5.0M', 'High', 'Launch week', 'Alex', 'Book intro call', 'Strong Hyperliquid fit'],
    ['Olympus Alpha', 'DAO', 'Interested', 'APAC', '$1.2M', 'Medium', 'Post-audit', 'Mia', 'Send updated materials', 'Wants clearer yield assumptions'],
  ].forEach(row => stmt.run(...row));
}

if (!hasRows('launch_tasks')) {
  const stmt = db.prepare(`INSERT INTO launch_tasks (task_name, workstream, owner, status, priority, risk_level, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Final Audit Remediation', 'Smart Contracts & Audit', 'Phil', 'In Progress', 'Critical', 'Low', '2026-04-12', 'Close remaining audit items'],
    ['Invite campaign visuals', 'Docs / Comms', 'Mia', 'Blocked', 'High', '2026-04-10', 'Needed for scarcity launch'],
  ].forEach(row => stmt.run(...row));
}

if (!hasRows('invite_batches')) {
  const stmt = db.prepare(`INSERT INTO invite_batches (batch_name, source, max_uses, used_count, status, expires_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  [
    ['KOL Wave 1', 'KOL', 250, 143, 'Active', '2026-04-20', 'For launch narrative partners'],
    ['Fund Friends & Family', 'Fund', 50, 17, 'Active', '2026-04-25', 'High-cap invite segment'],
  ].forEach(row => stmt.run(...row));
}

if (!hasRows('campaigns')) {
  const stmt = db.prepare(`INSERT INTO campaigns (name, narrative, channels, owner, status, launch_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Hyperliquid Native Yield Stable Launch Thread', 'Native Yield Stable', 'X, Telegram, Discord', 'Mia', 'Drafting', '2026-04-12', 'Long-form explainer'],
    ['Invite-only Beta Scarcity Campaign', 'Scarcity / FOMO', 'X, KOL, Community', 'Alex', 'Scheduled', '2026-04-15', 'Drive waitlist and invite activation'],
  ].forEach(row => stmt.run(...row));
}

if (!hasRows('kol_contacts')) {
  const stmt = db.prepare(`INSERT INTO kol_contacts (name, handle, platform, category, region, audience, contact_person, stage, rate_card, deliverable, publish_date, blockers, last_contact_at, next_action, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Route 2 Alpha', '@route2alpha', 'X', 'KOL', 'EN', '180K', 'Mia', 'Confirmed', '$2,500', 'Launch thread + quote RT', '2026-04-14', 'Waiting final asset pack', '2026-04-07', 'Send final creatives', 'Strong Hyperliquid fit'],
    ['WhaleDAO Radio', '@whaledaoradio', 'X / Space', 'Media', 'Global', '95K', 'Alex', 'Negotiating', '$1,800', 'AMA package', '2026-04-16', 'Needs audit timing clarity', '2026-04-06', 'Share audit ETA + talking points', 'Good for community credibility'],
  ].forEach(row => stmt.run(...row));
}

module.exports = db;
