const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getDb, save } = require('../db/init');
const { broadcast } = require('../services/sse');

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

// GET /api/payments
router.get('/', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();
    const { status, type } = req.query;
    let sql = "SELECT p.*, l.first_name, l.last_name, u.name as viewer_name FROM payments p LEFT JOIN leads l ON p.lead_id = l.id LEFT JOIN users u ON p.viewer_id = u.id WHERE 1=1";
    const params = [];
    if (status) { sql += " AND p.status = ?"; params.push(status); }
    if (type) { sql += " AND p.type = ?"; params.push(type); }
    sql += " ORDER BY p.created_at DESC";

    const result = db.exec(sql, params);
    res.json({ payments: rowsToObjects(result) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments/overdue
router.get('/overdue', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT p.*, l.first_name, l.last_name, l.phone, l.email, u.name as viewer_name
       FROM payments p LEFT JOIN leads l ON p.lead_id = l.id LEFT JOIN users u ON p.viewer_id = u.id
       WHERE p.status = 'overdue' OR (p.status = 'pending' AND p.due_date < datetime('now'))
       ORDER BY p.due_date ASC`
    );
    res.json({ payments: rowsToObjects(result) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments/promises
router.get('/promises', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT p.*, l.first_name, l.last_name, l.phone, u.name as viewer_name
       FROM payments p LEFT JOIN leads l ON p.lead_id = l.id LEFT JOIN users u ON p.viewer_id = u.id
       WHERE p.type = 'promise'
       ORDER BY p.due_date ASC`
    );
    res.json({ payments: rowsToObjects(result) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/payments/:id
router.patch('/:id', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const db = await getDb();
    const sets = ["updated_at = datetime('now')"];
    const params = [];
    if (status) { sets.push('status = ?'); params.push(status); }
    if (notes !== undefined) { sets.push('notes = ?'); params.push(notes); }
    if (status === 'collected') { sets.push("collected_date = datetime('now')"); }
    params.push(req.params.id);

    db.run(`UPDATE payments SET ${sets.join(', ')} WHERE id = ?`, params);
    save();

    const result = db.exec("SELECT * FROM payments WHERE id = ?", [req.params.id]);
    const payment = rowsToObjects(result)[0];
    broadcast('payment_updated', payment);
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
