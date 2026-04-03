-- ICONIC In-House Call Dashboard — Database Schema

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('available', 'on_call', 'break', 'offline')),
    status_changed_at TEXT DEFAULT (datetime('now')),
    daily_room_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    state TEXT,
    timezone TEXT,
    source TEXT,
    pool TEXT NOT NULL CHECK (pool IN ('no_show', 'booker_transfer', 'missed_pitch', 'old_lead')),
    weight INTEGER NOT NULL CHECK (weight IN (5, 3, 2, 1)),
    last_message TEXT,
    last_message_at TEXT,
    ghl_contact_id TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'routed', 'waiting_room', 'on_call',
        'closed', 'promise', 'follow_up', 'not_interested', 'no_show', 'parked'
    )),
    parked_until TEXT,
    parked_note TEXT,
    assigned_viewer_id INTEGER REFERENCES users(id),
    routed_at TEXT,
    routed_by_id INTEGER REFERENCES users(id),
    routing_notes TEXT,
    call_started_at TEXT,
    call_ended_at TEXT,
    outcome TEXT CHECK (outcome IN ('closed', 'promise', 'follow_up', 'not_interested', 'no_show') OR outcome IS NULL),
    payment_tier TEXT CHECK (payment_tier IN ('pif', 'deposit', 'weekly', 'biweekly', 'monthly', 'promise') OR payment_tier IS NULL),
    revenue_on_call INTEGER DEFAULT 0,
    promise_amount INTEGER DEFAULT 0,
    promise_date TEXT,
    subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('active', 'pending', 'none')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    viewer_id INTEGER REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('pif', 'deposit', 'weekly', 'biweekly', 'monthly', 'promise', 'collection')),
    amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('collected', 'pending', 'overdue', 'failed', 'cancelled')),
    due_date TEXT,
    collected_date TEXT,
    square_subscription_id TEXT,
    square_payment_id TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    plan TEXT NOT NULL DEFAULT 'full' CHECK (plan IN ('full', 'portfolio_only', 'keep_alive', 'paused')),
    price_cents INTEGER NOT NULL DEFAULT 0,
    frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'monthly') OR frequency IS NULL),
    square_subscription_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reduced', 'paused', 'cancelled', 'churned')),
    started_at TEXT DEFAULT (datetime('now')),
    reduced_at TEXT,
    paused_at TEXT,
    cancelled_at TEXT,
    instagram_upsell TEXT DEFAULT 'none' CHECK (instagram_upsell IN ('none', 'keep_going', 'growth', 'full_management')),
    instagram_started_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    lead_id INTEGER REFERENCES leads(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_pool ON leads(pool);
CREATE INDEX IF NOT EXISTS idx_leads_weight ON leads(weight DESC);
CREATE INDEX IF NOT EXISTS idx_leads_queue ON leads(status, weight DESC, last_message_at ASC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_viewer_id);
CREATE INDEX IF NOT EXISTS idx_payments_lead ON payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lead ON subscriptions(lead_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
