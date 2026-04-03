const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getDb } = require('../db/init');

const router = express.Router();

function val(result) {
  return result.length && result[0].values[0][0] !== null ? result[0].values[0][0] : 0;
}

function rowsToObjects(result) {
  if (!result.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

// GET /api/stats/today
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];

    const totalCalls = val(db.exec("SELECT COUNT(*) FROM leads WHERE date(call_started_at) = ? OR (date(created_at) = ? AND status != 'queued' AND status != 'parked')", [today, today]));
    const closes = val(db.exec("SELECT COUNT(*) FROM leads WHERE outcome = 'closed' AND date(call_ended_at) = ?", [today]));
    const promises = val(db.exec("SELECT COUNT(*) FROM leads WHERE outcome = 'promise' AND date(call_ended_at) = ?", [today]));
    const revenue = val(db.exec("SELECT COALESCE(SUM(revenue_on_call), 0) FROM leads WHERE outcome = 'closed' AND date(call_ended_at) = ?", [today]));
    const queued = val(db.exec("SELECT COUNT(*) FROM leads WHERE status = 'queued'"));
    const onCall = val(db.exec("SELECT COUNT(*) FROM leads WHERE status = 'on_call'"));

    const completed = closes + promises + val(db.exec("SELECT COUNT(*) FROM leads WHERE outcome IN ('follow_up', 'not_interested', 'no_show') AND date(call_ended_at) = ?", [today]));
    const dealRate = completed > 0 ? Math.round((closes / completed) * 100) : 0;

    res.json({
      calls: completed,
      closes,
      promises,
      revenue_cents: revenue,
      deal_rate: dealRate,
      queue_size: queued,
      on_call: onCall,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/leaderboard
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    const { period } = req.query; // 'today', 'week', 'month'

    let dateFilter;
    if (period === 'week') {
      dateFilter = "date(l.call_ended_at) >= date('now', '-7 days')";
    } else if (period === 'month') {
      dateFilter = "date(l.call_ended_at) >= date('now', '-30 days')";
    } else {
      dateFilter = `date(l.call_ended_at) = '${today}'`;
    }

    const result = db.exec(
      `SELECT u.id, u.name, u.status,
        COUNT(CASE WHEN l.outcome IS NOT NULL THEN 1 END) as calls,
        COUNT(CASE WHEN l.outcome = 'closed' THEN 1 END) as closes,
        COUNT(CASE WHEN l.outcome = 'promise' THEN 1 END) as promises,
        COALESCE(SUM(CASE WHEN l.outcome = 'closed' THEN l.revenue_on_call ELSE 0 END), 0) as revenue_cents,
        CASE WHEN COUNT(CASE WHEN l.outcome IS NOT NULL THEN 1 END) > 0
          THEN ROUND(100.0 * COUNT(CASE WHEN l.outcome = 'closed' THEN 1 END) / COUNT(CASE WHEN l.outcome IS NOT NULL THEN 1 END))
          ELSE 0 END as deal_rate
       FROM users u
       LEFT JOIN leads l ON l.assigned_viewer_id = u.id AND ${dateFilter}
       WHERE u.role = 'viewer' AND u.is_active = 1
       GROUP BY u.id ORDER BY revenue_cents DESC`
    );

    res.json({ leaderboard: rowsToObjects(result) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/pnl
router.get('/pnl', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const db = await getDb();
    const { month } = req.query; // YYYY-MM format

    let dateFilter = "1=1";
    if (month) {
      dateFilter = `strftime('%Y-%m', l.call_ended_at) = '${month}'`;
    }

    const revenue = val(db.exec(`SELECT COALESCE(SUM(l.revenue_on_call), 0) FROM leads l WHERE l.outcome = 'closed' AND ${dateFilter}`));
    const signups = val(db.exec(`SELECT COUNT(*) FROM leads l WHERE l.outcome = 'closed' AND ${dateFilter}`));
    const promiseCount = val(db.exec(`SELECT COUNT(*) FROM leads l WHERE l.outcome = 'promise' AND ${dateFilter}`));
    const totalCalls = val(db.exec(`SELECT COUNT(*) FROM leads l WHERE l.outcome IS NOT NULL AND ${dateFilter}`));

    // MRR from subscriptions
    const mrr = val(db.exec("SELECT COALESCE(SUM(price_cents), 0) FROM subscriptions WHERE status IN ('active', 'reduced')"));

    res.json({
      revenue_cents: revenue,
      signups,
      promises: promiseCount,
      total_calls: totalCalls,
      deal_rate: totalCalls > 0 ? Math.round((signups / totalCalls) * 100) : 0,
      mrr_cents: mrr,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
