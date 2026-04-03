const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getDb, save } = require('../db/init');
const { broadcast, sendToUser } = require('../services/sse');

const router = express.Router();

function rowsToObjects(result) {
  if (!result.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

// GET /api/leads — with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { status, pool, assigned_viewer_id } = req.query;
    let sql = "SELECT * FROM leads WHERE 1=1";
    const params = [];

    if (status) { sql += " AND status = ?"; params.push(status); }
    if (pool) { sql += " AND pool = ?"; params.push(pool); }
    if (assigned_viewer_id) { sql += " AND assigned_viewer_id = ?"; params.push(assigned_viewer_id); }

    // Queue ordering: weight DESC, then oldest first
    if (status === 'queued') {
      sql += " ORDER BY weight DESC, last_message_at ASC";
    } else {
      sql += " ORDER BY updated_at DESC";
    }

    const result = db.exec(sql, params);
    res.json({ leads: rowsToObjects(result) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads — add lead
router.post('/', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { first_name, last_name, phone, email, state, timezone, source, pool, weight, last_message, notes } = req.body;
    if (!first_name || !pool) return res.status(400).json({ error: 'first_name and pool required' });

    const poolWeights = { no_show: 5, booker_transfer: 3, missed_pitch: 2, old_lead: 1 };
    const w = weight || poolWeights[pool] || 1;

    const db = await getDb();
    db.run(
      `INSERT INTO leads (first_name, last_name, phone, email, state, timezone, source, pool, weight, last_message, last_message_at, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, 'queued')`,
      [first_name, last_name || null, phone || null, email || null, state || null, timezone || null, source || null, pool, w, last_message || null, notes || null]
    );
    save();

    const result = db.exec("SELECT * FROM leads ORDER BY id DESC LIMIT 1");
    const lead = rowsToObjects(result)[0];
    broadcast('lead_queued', lead);
    res.status(201).json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/leads/:id/route — route to viewer
router.patch('/:id/route', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { viewer_id, notes } = req.body;
    if (!viewer_id) return res.status(400).json({ error: 'viewer_id required' });

    const db = await getDb();

    // Check viewer is available
    const vResult = db.exec("SELECT * FROM users WHERE id = ? AND role = 'viewer'", [viewer_id]);
    const viewer = rowsToObjects(vResult)[0];
    if (!viewer) return res.status(404).json({ error: 'Viewer not found' });
    if (viewer.status !== 'available') return res.status(409).json({ error: `Viewer is ${viewer.status}, not available` });

    // Update lead
    db.run(
      `UPDATE leads SET status = 'routed', assigned_viewer_id = ?, routed_at = datetime('now'), routed_by_id = ?, routing_notes = ?, updated_at = datetime('now') WHERE id = ?`,
      [viewer_id, req.user.id, notes || null, req.params.id]
    );
    save();

    const result = db.exec("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    const lead = rowsToObjects(result)[0];

    // Log activity
    db.run("INSERT INTO activity_log (user_id, lead_id, action, details) VALUES (?, ?, 'route', ?)",
      [req.user.id, req.params.id, `Routed to ${viewer.name}${notes ? ': ' + notes : ''}`]);
    save();

    broadcast('lead_routed', { lead, viewer });
    sendToUser(viewer_id, 'lead_assigned', lead);
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/leads/:id/park
router.patch('/:id/park', authMiddleware, async (req, res) => {
  try {
    const { parked_until, note } = req.body;
    const db = await getDb();
    db.run(
      "UPDATE leads SET status = 'parked', parked_until = ?, parked_note = ?, updated_at = datetime('now') WHERE id = ?",
      [parked_until || null, note || null, req.params.id]
    );
    save();

    const result = db.exec("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    const lead = rowsToObjects(result)[0];
    broadcast('lead_parked', lead);
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/leads/:id/unpark
router.patch('/:id/unpark', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    db.run(
      "UPDATE leads SET status = 'queued', parked_until = NULL, parked_note = NULL, updated_at = datetime('now') WHERE id = ?",
      [req.params.id]
    );
    save();

    const result = db.exec("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    const lead = rowsToObjects(result)[0];
    broadcast('lead_queued', lead);
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/leads/:id/start-call
router.patch('/:id/start-call', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    db.run(
      "UPDATE leads SET status = 'on_call', call_started_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      [req.params.id]
    );
    // Set viewer status to on_call
    db.run("UPDATE users SET status = 'on_call', status_changed_at = datetime('now') WHERE id = ?", [req.user.id]);
    save();

    const result = db.exec("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    const lead = rowsToObjects(result)[0];
    const uResult = db.exec("SELECT id, name, role, status FROM users WHERE id = ?", [req.user.id]);
    const user = rowsToObjects(uResult)[0];

    broadcast('lead_on_call', { lead, viewer: user });
    broadcast('viewer_status', user);
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/leads/:id/outcome
router.patch('/:id/outcome', authMiddleware, async (req, res) => {
  try {
    const { outcome, payment_tier, revenue_on_call, promise_amount, promise_date, subscription_status, notes } = req.body;
    if (!outcome) return res.status(400).json({ error: 'outcome required' });

    const db = await getDb();
    db.run(
      `UPDATE leads SET status = ?, outcome = ?, payment_tier = ?, revenue_on_call = ?, promise_amount = ?,
       promise_date = ?, subscription_status = ?, notes = ?, call_ended_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [outcome, outcome, payment_tier || null, revenue_on_call || 0, promise_amount || 0,
       promise_date || null, subscription_status || 'none', notes || null, req.params.id]
    );

    // Set viewer back to available
    db.run("UPDATE users SET status = 'available', status_changed_at = datetime('now') WHERE id = ?", [req.user.id]);
    save();

    const result = db.exec("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    const lead = rowsToObjects(result)[0];
    const uResult = db.exec("SELECT id, name, role, status FROM users WHERE id = ?", [req.user.id]);
    const user = rowsToObjects(uResult)[0];

    // Log activity
    db.run("INSERT INTO activity_log (user_id, lead_id, action, details) VALUES (?, ?, ?, ?)",
      [req.user.id, req.params.id, 'outcome', `${outcome}${payment_tier ? ' - ' + payment_tier : ''}`]);

    // Create payment record if closed/promise
    if (outcome === 'closed' && revenue_on_call > 0) {
      db.run(
        "INSERT INTO payments (lead_id, viewer_id, type, amount, status, collected_date) VALUES (?, ?, ?, ?, 'collected', datetime('now'))",
        [req.params.id, req.user.id, payment_tier || 'pif', revenue_on_call]
      );
    }
    if (outcome === 'promise' && promise_amount > 0) {
      db.run(
        "INSERT INTO payments (lead_id, viewer_id, type, amount, status, due_date) VALUES (?, ?, 'promise', ?, 'pending', ?)",
        [req.params.id, req.user.id, promise_amount, promise_date || null]
      );
    }
    save();

    broadcast('lead_outcome', { lead, viewer: user });
    broadcast('viewer_status', user);
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leads/import — CSV bulk upload
router.post('/import', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads)) return res.status(400).json({ error: 'leads array required' });

    const db = await getDb();
    const poolWeights = { no_show: 5, booker_transfer: 3, missed_pitch: 2, old_lead: 1 };
    let count = 0;

    for (const l of leads) {
      if (!l.first_name || !l.pool) continue;
      const w = l.weight || poolWeights[l.pool] || 1;
      db.run(
        `INSERT INTO leads (first_name, last_name, phone, email, state, timezone, source, pool, weight, last_message, last_message_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'queued')`,
        [l.first_name, l.last_name || null, l.phone || null, l.email || null, l.state || null, l.timezone || null, l.source || null, l.pool, w, l.last_message || null]
      );
      count++;
    }
    save();

    broadcast('leads_imported', { count });
    res.json({ imported: count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/leads/export
router.get('/export', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec("SELECT * FROM leads ORDER BY created_at DESC");
    const leads = rowsToObjects(result);

    // Return as JSON (client can convert to CSV)
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
