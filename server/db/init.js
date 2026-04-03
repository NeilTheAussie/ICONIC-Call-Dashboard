const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'iconic.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let _db = null;

async function getDb() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  _db.run(schema);
  save();

  return _db;
}

function save() {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function seed() {
  const db = await getDb();

  // Check if already seeded
  const result = db.exec("SELECT COUNT(*) as cnt FROM users");
  if (result.length > 0 && result[0].values[0][0] > 0) {
    console.log('Database already seeded, skipping');
    return;
  }

  // Hash passwords
  const defaultPass = await bcrypt.hash('iconic2026', 10);

  // Insert admins
  const admins = [
    ['neil@stingrai.com', 'Neil'],
    ['mike@iconic.ai', 'Mike'],
    ['martin@iconic.ai', 'Martin'],
    ['leanne@iconic.ai', 'Leanne'],
  ];
  for (const [email, name] of admins) {
    db.run("INSERT OR IGNORE INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, 'admin', 'offline')", [email, defaultPass, name]);
  }

  // Manager
  db.run("INSERT OR IGNORE INTO users (email, password_hash, name, role, status) VALUES (?, ?, 'Jill', 'manager', 'offline')", ['jill@iconic.ai', defaultPass]);

  // 8 Viewers
  const viewers = [
    ['viewer1@iconic.ai', 'Sarah', 'https://iconic.daily.co/room-sarah'],
    ['viewer2@iconic.ai', 'Tom', 'https://iconic.daily.co/room-tom'],
    ['viewer3@iconic.ai', 'Amy', 'https://iconic.daily.co/room-amy'],
    ['viewer4@iconic.ai', 'Jake', 'https://iconic.daily.co/room-jake'],
    ['viewer5@iconic.ai', 'Lisa', 'https://iconic.daily.co/room-lisa'],
    ['viewer6@iconic.ai', 'Dan', 'https://iconic.daily.co/room-dan'],
    ['viewer7@iconic.ai', 'Mia', 'https://iconic.daily.co/room-mia'],
    ['viewer8@iconic.ai', 'Chris', 'https://iconic.daily.co/room-chris'],
  ];
  for (const [email, name, room] of viewers) {
    db.run("INSERT OR IGNORE INTO users (email, password_hash, name, role, status, daily_room_url) VALUES (?, ?, ?, 'viewer', 'offline', ?)", [email, defaultPass, name, room]);
  }

  // Sample leads — inserted directly (seed.sql datetime functions don't work well with sql.js split)
  const now = new Date().toISOString().replace('T', ' ').split('.')[0];
  const ago = (mins) => {
    const d = new Date(Date.now() - mins * 60000);
    return d.toISOString().replace('T', ' ').split('.')[0];
  };

  const leads = [
    // no_show (weight 5)
    ['Jessica', 'Martinez', '(310) 555-1234', 'jess.m@email.com', 'CA', 'PST', 'Studio booking', 'no_show', 5, 'Sorry I missed it, is there another way?', ago(2), 'queued'],
    ['DeAndre', 'Williams', '(713) 555-5678', 'deandre.w@email.com', 'TX', 'CST', 'Studio booking', 'no_show', 5, 'Yes I\'m interested', ago(5), 'queued'],
    ['Priya', 'Patel', '(617) 555-9012', 'priya.p@email.com', 'MA', 'EST', 'Studio booking', 'no_show', 5, 'What do I need to do?', ago(12), 'queued'],
    // booker_transfer (weight 3)
    ['Marcus', 'Thompson', '(214) 555-3456', 'marcus.t@email.com', 'TX', 'CST', 'Booker handoff', 'booker_transfer', 3, 'Booker transferred - interested in ICONIC', ago(1), 'queued'],
    ['Aaliyah', 'Johnson', '(773) 555-7890', 'aaliyah.j@email.com', 'IL', 'CST', 'Booker handoff', 'booker_transfer', 3, 'Booker transferred - asked about portfolio', ago(3), 'queued'],
    // missed_pitch (weight 2)
    ['Brandon', 'Lee', '(415) 555-2345', 'brandon.l@email.com', 'CA', 'PST', 'Studio missed pitch', 'missed_pitch', 2, 'Actually been thinking about it', ago(8), 'queued'],
    ['Sophia', 'Davis', '(305) 555-6789', 'sophia.d@email.com', 'FL', 'EST', 'Studio missed pitch', 'missed_pitch', 2, 'How much was it again?', ago(15), 'queued'],
    ['Tyler', 'Wilson', '(503) 555-0123', 'tyler.w@email.com', 'OR', 'PST', 'Studio missed pitch', 'missed_pitch', 2, 'Can we talk after 4pm my time?', ago(20), 'parked'],
    // old_lead (weight 1)
    ['Mia', 'Garcia', '(617) 555-4567', 'mia.g@email.com', 'MA', 'EST', 'Database re-engage', 'old_lead', 1, 'YES', ago(10), 'queued'],
    ['Jordan', 'Brown', '(713) 555-8901', 'jordan.b@email.com', 'TX', 'CST', 'Database re-engage', 'old_lead', 1, 'Sounds interesting tell me more', ago(25), 'queued'],
    ['Chloe', 'Kim', '(212) 555-3456', 'chloe.k@email.com', 'NY', 'EST', 'Database re-engage', 'old_lead', 1, 'What is this?', ago(30), 'queued'],
    ['Ethan', 'Roberts', '(404) 555-7890', 'ethan.r@email.com', 'GA', 'EST', 'Database re-engage', 'old_lead', 1, 'Maybe later this week', ago(45), 'parked'],
  ];

  for (const l of leads) {
    db.run(
      `INSERT INTO leads (first_name, last_name, phone, email, state, timezone, source, pool, weight, last_message, last_message_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, l
    );
  }

  // Set parked lead details
  db.run("UPDATE leads SET parked_until = ?, parked_note = 'After 4pm PST - West Coast' WHERE first_name = 'Tyler'", [ago(-180)]);
  db.run("UPDATE leads SET parked_until = ?, parked_note = 'Said later this week' WHERE first_name = 'Ethan'", [ago(-1440)]);

  save();
  console.log('Database seeded successfully');
}

// CLI mode
if (require.main === module) {
  (async () => {
    await getDb();
    if (process.argv.includes('--seed')) {
      await seed();
    }
    console.log('Database initialized at', DB_PATH);
    process.exit(0);
  })();
}

module.exports = { getDb, save, seed };
