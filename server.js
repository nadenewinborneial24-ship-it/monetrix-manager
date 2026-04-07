const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4174;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const resourceConfig = {
  leads: {
    table: 'leads',
    idField: 'id',
    required: ['name'],
    fields: ['name', 'type', 'stage', 'region', 'potential_liquidity', 'confidence', 'expected_timing', 'owner', 'next_action', 'notes'],
  },
  tasks: {
    table: 'launch_tasks',
    idField: 'id',
    required: ['task_name'],
    fields: ['task_name', 'workstream', 'owner', 'status', 'priority', 'risk_level', 'due_date', 'notes'],
  },
  invites: {
    table: 'invite_batches',
    idField: 'id',
    required: ['batch_name'],
    fields: ['batch_name', 'source', 'max_uses', 'used_count', 'status', 'expires_at', 'notes'],
  },
  campaigns: {
    table: 'campaigns',
    idField: 'id',
    required: ['name'],
    fields: ['name', 'narrative', 'channels', 'owner', 'status', 'launch_date', 'notes'],
  },
  kols: {
    table: 'kol_contacts',
    idField: 'id',
    required: ['name'],
    fields: ['name', 'handle', 'platform', 'category', 'region', 'audience', 'contact_person', 'stage', 'rate_card', 'deliverable', 'publish_date', 'blockers', 'last_contact_at', 'next_action', 'notes'],
  },
};

function list(table, orderBy = 'id DESC') {
  return db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
}

function getOne(table, id) {
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

function pickFields(body, fields) {
  const out = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) out[field] = body[field];
  }
  return out;
}

function validateRequired(required, payload) {
  const missing = required.filter((field) => !payload[field]);
  return missing;
}

function mountCrud(resourceName, config) {
  const { table, fields, required } = config;

  app.get(`/api/${resourceName}`, (_req, res) => {
    res.json(list(table));
  });

  app.get(`/api/${resourceName}/:id`, (req, res) => {
    const row = getOne(table, req.params.id);
    if (!row) return res.status(404).json({ error: `${resourceName.slice(0, -1)} not found` });
    res.json(row);
  });

  app.post(`/api/${resourceName}`, (req, res) => {
    const payload = pickFields(req.body, fields);
    const missing = validateRequired(required, payload);
    if (missing.length) return res.status(400).json({ error: `${missing.join(', ')} is required` });

    const cols = [...Object.keys(payload), 'updated_at'];
    const placeholders = cols.map((c) => (c === 'updated_at' ? 'CURRENT_TIMESTAMP' : `@${c}`)).join(', ');
    const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`);
    const result = stmt.run(payload);
    res.json(getOne(table, result.lastInsertRowid));
  });

  app.put(`/api/${resourceName}/:id`, (req, res) => {
    const existing = getOne(table, req.params.id);
    if (!existing) return res.status(404).json({ error: `${resourceName.slice(0, -1)} not found` });

    const payload = pickFields(req.body, fields);
    if (!Object.keys(payload).length) return res.status(400).json({ error: 'No fields to update' });

    const assignments = Object.keys(payload).map((field) => `${field} = @${field}`);
    assignments.push('updated_at = CURRENT_TIMESTAMP');
    const stmt = db.prepare(`UPDATE ${table} SET ${assignments.join(', ')} WHERE id = @id`);
    stmt.run({ id: req.params.id, ...payload });
    res.json(getOne(table, req.params.id));
  });

  app.delete(`/api/${resourceName}/:id`, (req, res) => {
    const existing = getOne(table, req.params.id);
    if (!existing) return res.status(404).json({ error: `${resourceName.slice(0, -1)} not found` });
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.json({ ok: true, id: Number(req.params.id) });
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'monetrix-manager', db: 'sqlite' });
});

for (const [resourceName, config] of Object.entries(resourceConfig)) {
  mountCrud(resourceName, config);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monetrix manager listening on http://0.0.0.0:${PORT}`);
});
