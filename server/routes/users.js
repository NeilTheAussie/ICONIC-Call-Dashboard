const express = require('express');
const bcrypt = require('bcryptjs');
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

// GET /api/users
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec("SELECT id, email, name, role, status, status_changed_at, daily_room_url, is_active, created_at FROM users ORDER BY role, name");
    res.json({ users: rowsToObjects(result) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users — create user (admin/manager only)
router.post('/', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }
    if (req.user.role === 'manager' && role !== 'viewer') {
      return res.status(403).json({ error: 'Managers can only create viewers' });
    }

    const db = await getDb();
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)", [email, hash, name, role]);
    save();

    const result = db.exec("SELECT id, email, name, role, status FROM users WHERE email = ?", [email]);
    const user = rowsToObjects(result)[0];
    broadcast('user_created', user);
    res.status(201).json({ user });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = await getDb();
    const { name, email, role, is_active } = req.body;
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (email !== undefined) { sets.push('email = ?'); params.push(email); }
    if (role !== undefined) { sets.push('role = ?'); params.push(role); }
    if (is_active !== undefined) { sets.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });

    sets.push("updated_at = datetime('now')");
    params.push(req.params.id);
    db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    save();

    const result = db.exec("SELECT id, email, name, role, status, is_active FROM users WHERE id = ?", [req.params.id]);
    const user = rowsToObjects(result)[0];
    broadcast('user_updated', user);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'on_call', 'break', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Viewers can only change their own status
    if (req.user.role === 'viewer' && parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ error: 'Can only change your own status' });
    }

    const db = await getDb();
    db.run("UPDATE users SET status = ?, status_changed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", [status, req.params.id]);
    save();

    const result = db.exec("SELECT id, email, name, role, status, status_changed_at FROM users WHERE id = ?", [req.params.id]);
    const user = rowsToObjects(result)[0];
    broadcast('viewer_status', user);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
