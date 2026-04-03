require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, seed } = require('./db/init');
const { addClient } = require('./services/sse');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/stats', require('./routes/stats'));

// SSE endpoint — supports token as query param since EventSource can't send headers
app.get('/api/events', (req, res) => {
  const jwt = require('jsonwebtoken');
  const token = req.query.token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'iconic-dashboard-dev-secret');
    addClient(user.id, res);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Webhook endpoints (placeholders)
app.post('/api/daily/webhook', (req, res) => {
  console.log('Daily.co webhook:', req.body);
  res.json({ received: true });
});

app.post('/api/ghl/webhook', (req, res) => {
  console.log('GHL webhook:', req.body);
  res.json({ received: true });
});

app.post('/api/square/webhook', (req, res) => {
  console.log('Square webhook:', req.body);
  res.json({ received: true });
});

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// Start
(async () => {
  await getDb();
  await seed();

  app.listen(PORT, () => {
    console.log(`ICONIC Call Dashboard server running on port ${PORT}`);
  });
})();
