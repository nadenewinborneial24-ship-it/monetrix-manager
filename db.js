const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lfotPn9VO3DM@ep-red-recipe-a18ecuoo-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS launch_tasks (
      id SERIAL PRIMARY KEY,
      task_name TEXT NOT NULL,
      workstream TEXT,
      owner TEXT,
      status TEXT,
      priority TEXT,
      risk_level TEXT,
      due_date TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invite_batches (
      id SERIAL PRIMARY KEY,
      batch_name TEXT NOT NULL,
      source TEXT,
      max_uses INTEGER,
      used_count INTEGER DEFAULT 0,
      status TEXT,
      expires_at TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      narrative TEXT,
      channels TEXT,
      owner TEXT,
      status TEXT,
      launch_date TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kol_contacts (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const seeds = [
    { table: 'leads', check: 'SELECT COUNT(*)::int AS count FROM leads', insert: `INSERT INTO leads (name, type, stage, region, potential_liquidity, confidence, expected_timing, owner, next_action, notes) VALUES ('Aether Ventures','VC','New','Global','$2.5M - $5.0M','High','Launch week','SYC','Book intro call','Strong Hyperliquid fit')` },
    { table: 'launch_tasks', check: 'SELECT COUNT(*)::int AS count FROM launch_tasks', insert: `INSERT INTO launch_tasks (task_name, workstream, owner, status, priority, risk_level, due_date, notes) VALUES ('Final Audit Remediation','Smart Contracts & Audit','Kane','In Progress','Critical','Low','2026-04-12','Close remaining audit items')` },
    { table: 'invite_batches', check: 'SELECT COUNT(*)::int AS count FROM invite_batches', insert: `INSERT INTO invite_batches (batch_name, source, max_uses, used_count, status, expires_at, notes) VALUES ('KOL Wave 1','KOL',250,143,'Active','2026-04-20','For launch narrative partners')` },
    { table: 'campaigns', check: 'SELECT COUNT(*)::int AS count FROM campaigns', insert: `INSERT INTO campaigns (name, narrative, channels, owner, status, launch_date, notes) VALUES ('Invite-only Beta Scarcity Campaign','Scarcity / FOMO','X, KOL, Community','SYC','Scheduled','2026-04-15','Drive waitlist and invite activation')` },
    { table: 'kol_contacts', check: 'SELECT COUNT(*)::int AS count FROM kol_contacts', insert: `INSERT INTO kol_contacts (name, handle, platform, category, region, audience, contact_person, stage, rate_card, deliverable, publish_date, blockers, last_contact_at, next_action, notes) VALUES ('Route 2 Alpha','@route2alpha','X','KOL','EN','180K','SYC','Confirmed','$2,500','Launch thread + quote RT','2026-04-14','Waiting final asset pack','2026-04-07','Send final creatives','Strong Hyperliquid fit')` },
  ];

  for (const seed of seeds) {
    const { rows } = await query(seed.check);
    if (!rows[0].count) await query(seed.insert);
  }
}

module.exports = { pool, query, initDb };
