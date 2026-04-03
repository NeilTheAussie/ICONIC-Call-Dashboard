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

// GET /api/subscriptions
router.get('/', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(
      `SELECT s.*, l.first_name, l.last_name FROM subscriptions s
       LEFT JOIN leads l ON s.lead_id = l.id ORDER BY s.created_at DESC`
    );
    res.json({ subscriptions: rowsToObjects(result) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/subscriptions/health
router.get('/health', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();

    const active = db.exec("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'");
    const reduced = db.exec("SELECT COUNT(*) FROM subscriptions WHERE status = 'reduced'");
    const paused = db.exec("SELECT COUNT(*) FROM subscriptions WHERE status = 'paused'");
    const churned = db.exec("SELECT COUNT(*) FROM subscriptions WHERE status = 'churned'");
    const cancelled = db.exec("SELECT COUNT(*) FROM subscriptions WHERE status = 'cancelled'");
    const mrrResult = db.exec("SELECT SUM(price_cents) FROM subscriptions WHERE status IN ('active', 'reduced')");

    const mrr = mrrResult.length && mrrResult[0].values[0][0] ? mrrResult[0].values[0][0] : 0;

    res.json({
      active: active.length ? active[0].values[0][0] : 0,
      reduced: reduced.length ? reduced[0].values[0][0] : 0,
      paused: paused.length ? paused[0].values[0][0] : 0,
      churned: churned.length ? churned[0].values[0][0] : 0,
      cancelled: cancelled.length ? cancelled[0].values[0][0] : 0,
      mrr_cents: mrr,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/subscriptions/:id/reduce
router.patch('/:id/reduce', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { new_plan } = req.body;
    const planPrices = { full: 2499, portfolio_only: 1499, keep_alive: 999, paused: 0 };
    const price = planPrices[new_plan];
    if (price === undefined) return res.status(400).json({ error: 'Invalid plan' });

    const db = await getDb();
    const status = new_plan === 'paused' ? 'paused' : 'reduced';
    db.run(
      `UPDATE subscriptions SET plan = ?, price_cents = ?, status = ?, reduced_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      [new_plan, price, status, req.params.id]
    );
    save();

    const result = db.exec("SELECT * FROM subscriptions WHERE id = ?", [req.params.id]);
    const sub = rowsToObjects(result)[0];
    broadcast('subscription_updated', sub);
    res.json({ subscription: sub });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
