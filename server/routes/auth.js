const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { getDb, save } = require('../db/init');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = await getDb();
    const result = db.exec("SELECT * FROM users WHERE email = ? AND is_active = 1", [email]);
    if (!result.length || !result[0].values.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const cols = result[0].columns;
    const row = result[0].values[0];
    const user = {};
    cols.forEach((c, i) => user[c] = row[i]);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec("SELECT id, email, name, role, status, daily_room_url FROM users WHERE id = ?", [req.user.id]);
    if (!result.length || !result[0].values.length) return res.status(404).json({ error: 'User not found' });

    const cols = result[0].columns;
    const row = result[0].values[0];
    const user = {};
    cols.forEach((c, i) => user[c] = row[i]);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
