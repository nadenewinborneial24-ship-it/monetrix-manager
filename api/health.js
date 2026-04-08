const { query, initDb } = require('./lib/db');

module.exports = async function handler(_req, res) {
  try {
    await initDb();
    await query('SELECT 1');
    res.status(200).json({ ok: true, db: 'postgres' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
