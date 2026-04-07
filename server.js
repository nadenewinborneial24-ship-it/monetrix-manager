const express = require('express');
const { query, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 4174;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.sendFile(require('path').join(__dirname, 'index.html'));
});

const resourceConfig = {
  leads: { table: 'leads', required: ['name'], fields: ['name','type','stage','region','potential_liquidity','confidence','expected_timing','owner','next_action','notes'] },
  tasks: { table: 'launch_tasks', required: ['task_name'], fields: ['task_name','workstream','owner','status','priority','risk_level','due_date','notes'] },
  invites: { table: 'invite_batches', required: ['batch_name'], fields: ['batch_name','source','max_uses','used_count','status','expires_at','notes'] },
  campaigns: { table: 'campaigns', required: ['name'], fields: ['name','narrative','channels','owner','status','launch_date','notes'] },
  kols: { table: 'kol_contacts', required: ['name'], fields: ['name','handle','platform','category','region','audience','contact_person','stage','rate_card','deliverable','publish_date','blockers','last_contact_at','next_action','notes'] },
};

function pickFields(body, fields) {
  const out = {};
  for (const field of fields) if (Object.prototype.hasOwnProperty.call(body, field)) out[field] = body[field];
  return out;
}

function validateRequired(required, payload) {
  return required.filter((field) => !payload[field]);
}

function mountCrud(resourceName, config) {
  const { table, fields, required } = config;

  app.get(`/api/${resourceName}`, async (_req, res) => {
    const { rows } = await query(`SELECT * FROM ${table} ORDER BY id DESC`);
    res.json(rows);
  });

  app.get(`/api/${resourceName}/:id`, async (req, res) => {
    const { rows } = await query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: `${resourceName.slice(0, -1)} not found` });
    res.json(rows[0]);
  });

  app.post(`/api/${resourceName}`, async (req, res) => {
    const payload = pickFields(req.body, fields);
    const missing = validateRequired(required, payload);
    if (missing.length) return res.status(400).json({ error: `${missing.join(', ')} is required` });
    const cols = Object.keys(payload);
    const values = Object.values(payload);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await query(sql, values);
    res.json(rows[0]);
  });

  app.put(`/api/${resourceName}/:id`, async (req, res) => {
    const payload = pickFields(req.body, fields);
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'No fields to update' });
    const sets = Object.keys(payload).map((field, i) => `${field} = $${i + 1}`);
    const values = [...Object.values(payload), req.params.id];
    const sql = `UPDATE ${table} SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
    const { rows } = await query(sql, values);
    if (!rows.length) return res.status(404).json({ error: `${resourceName.slice(0, -1)} not found` });
    res.json(rows[0]);
  });

  app.delete(`/api/${resourceName}/:id`, async (req, res) => {
    const { rows } = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: `${resourceName.slice(0, -1)} not found` });
    res.json({ ok: true, id: Number(rows[0].id) });
  });
}

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, service: 'monetrix-manager', db: 'postgres' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

for (const [resourceName, config] of Object.entries(resourceConfig)) mountCrud(resourceName, config);

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Monetrix manager listening on http://0.0.0.0:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to init DB', err);
  process.exit(1);
});
