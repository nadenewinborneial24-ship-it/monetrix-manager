const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lfotPn9VO3DM@ep-red-recipe-a18ecuoo-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function query(text, params = []) {
  return pool.query(text, params);
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
}

module.exports = { query, initDb };
