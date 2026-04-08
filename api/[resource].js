const { query, initDb } = require('./lib/db');

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

module.exports = async function handler(req, res) {
  await initDb();
  const resourceName = req.query.resource;
  const id = req.query.id;
  const config = resourceConfig[resourceName];
  if (!config) return res.status(404).json({ error: 'resource not found' });
  const { table, fields, required } = config;

  try {
    if (req.method === 'GET' && !id) {
      const { rows } = await query(`SELECT * FROM ${table} ORDER BY id DESC`);
      return res.status(200).json(rows);
    }
    if (req.method === 'GET' && id) {
      const { rows } = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'POST') {
      const payload = pickFields(req.body || {}, fields);
      const missing = required.filter((field) => !payload[field]);
      if (missing.length) return res.status(400).json({ error: `${missing.join(', ')} is required` });
      const cols = Object.keys(payload);
      const values = Object.values(payload);
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const { rows } = await query(sql, values);
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'PUT' && id) {
      const payload = pickFields(req.body || {}, fields);
      if (!Object.keys(payload).length) return res.status(400).json({ error: 'No fields to update' });
      const sets = Object.keys(payload).map((field, i) => `${field} = $${i + 1}`);
      const values = [...Object.values(payload), id];
      const sql = `UPDATE ${table} SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`;
      const { rows } = await query(sql, values);
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE' && id) {
      const { rows } = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      return res.status(200).json({ ok: true, id: Number(rows[0].id) });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
