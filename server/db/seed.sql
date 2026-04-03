-- ICONIC In-House Call Dashboard — Seed Data
-- Passwords are bcrypt hashes — replace on first run with proper hashing

-- MMLN Admin Team
INSERT OR IGNORE INTO users (email, password_hash, name, role, status) VALUES
    ('neil@stingrai.com', '$2b$10$PLACEHOLDER', 'Neil', 'admin', 'offline'),
    ('mike@iconic.ai', '$2b$10$PLACEHOLDER', 'Mike', 'admin', 'offline'),
    ('martin@iconic.ai', '$2b$10$PLACEHOLDER', 'Martin', 'admin', 'offline'),
    ('leanne@iconic.ai', '$2b$10$PLACEHOLDER', 'Leanne', 'admin', 'offline');

-- Team Manager
INSERT OR IGNORE INTO users (email, password_hash, name, role, status) VALUES
    ('jill@iconic.ai', '$2b$10$PLACEHOLDER', 'Jill', 'manager', 'offline');

-- 8 Viewers (closers)
INSERT OR IGNORE INTO users (email, password_hash, name, role, status, daily_room_url) VALUES
    ('viewer1@iconic.ai', '$2b$10$PLACEHOLDER', 'Sarah', 'viewer', 'offline', 'https://iconic.daily.co/room-sarah'),
    ('viewer2@iconic.ai', '$2b$10$PLACEHOLDER', 'Tom', 'viewer', 'offline', 'https://iconic.daily.co/room-tom'),
    ('viewer3@iconic.ai', '$2b$10$PLACEHOLDER', 'Amy', 'viewer', 'offline', 'https://iconic.daily.co/room-amy'),
    ('viewer4@iconic.ai', '$2b$10$PLACEHOLDER', 'Jake', 'viewer', 'offline', 'https://iconic.daily.co/room-jake'),
    ('viewer5@iconic.ai', '$2b$10$PLACEHOLDER', 'Lisa', 'viewer', 'offline', 'https://iconic.daily.co/room-lisa'),
    ('viewer6@iconic.ai', '$2b$10$PLACEHOLDER', 'Dan', 'viewer', 'offline', 'https://iconic.daily.co/room-dan'),
    ('viewer7@iconic.ai', '$2b$10$PLACEHOLDER', 'Mia', 'viewer', 'offline', 'https://iconic.daily.co/room-mia'),
    ('viewer8@iconic.ai', '$2b$10$PLACEHOLDER', 'Chris', 'viewer', 'offline', 'https://iconic.daily.co/room-chris');

-- Sample Leads — all 4 pools
-- Pool: no_show (weight 5)
INSERT INTO leads (first_name, last_name, phone, email, state, timezone, source, pool, weight, last_message, last_message_at, status) VALUES
    ('Jessica', 'Martinez', '(310) 555-1234', 'jess.m@email.com', 'CA', 'PST', 'Studio booking', 'no_show', 5, 'Sorry I missed it, is there another way?', datetime('now', '-2 minutes'), 'queued'),
    ('DeAndre', 'Williams', '(713) 555-5678', 'deandre.w@email.com', 'TX', 'CST', 'Studio booking', 'no_show', 5, 'Yes I''m interested', datetime('now', '-5 minutes'), 'queued'),
    ('Priya', 'Patel', '(617) 555-9012', 'priya.p@email.com', 'MA', 'EST', 'Studio booking', 'no_show', 5, 'What do I need to do?', datetime('now', '-12 minutes'), 'queued');

-- Pool: booker_transfer (weight 3)
INSERT INTO leads (first_name, last_name, phone, email, state, timezone, source, pool, weight, last_message, last_message_at, status) VALUES
    ('Marcus', 'Thompson', '(214) 555-3456', 'marcus.t@email.com', 'TX', 'CST', 'Booker handoff', 'booker_transfer', 3, 'Booker transferred - interested in ICONIC', datetime('now', '-1 minutes'), 'queued'),
    ('Aaliyah', 'Johnson', '(773) 555-7890', 'aaliyah.j@email.com', 'IL', 'CST', 'Booker handoff', 'booker_transfer', 3, 'Booker transferred - asked about portfolio', datetime('now', '-3 minutes'), 'queued');

-- Pool: missed_pitch (weight 2)
INSERT INTO leads (first_name, last_name, phone, email, state, timezone, source, pool, weight, last_message, last_message_at, status) VALUES
    ('Brandon', 'Lee', '(415) 555-2345', 'brandon.l@email.com', 'CA', 'PST', 'Studio missed pitch', 'missed_pitch', 2, 'Actually been thinking about it', datetime('now', '-8 minutes'), 'queued'),
    ('Sophia', 'Davis', '(305) 555-6789', 'sophia.d@email.com', 'FL', 'EST', 'Studio missed pitch', 'missed_pitch', 2, 'How much was it again?', datetime('now', '-15 minutes'), 'queued'),
    ('Tyler', 'Wilson', '(503) 555-0123', 'tyler.w@email.com', 'OR', 'PST', 'Studio missed pitch', 'missed_pitch', 2, 'Can we talk after 4pm my time?', datetime('now', '-20 minutes'), 'parked');

-- Pool: old_lead (weight 1)
INSERT INTO leads (first_name, last_name, phone, email, state, timezone, source, pool, weight, last_message, last_message_at, status) VALUES
    ('Mia', 'Garcia', '(617) 555-4567', 'mia.g@email.com', 'MA', 'EST', 'Database re-engage', 'old_lead', 1, 'YES', datetime('now', '-10 minutes'), 'queued'),
    ('Jordan', 'Brown', '(713) 555-8901', 'jordan.b@email.com', 'TX', 'CST', 'Database re-engage', 'old_lead', 1, 'Sounds interesting tell me more', datetime('now', '-25 minutes'), 'queued'),
    ('Chloe', 'Kim', '(212) 555-3456', 'chloe.k@email.com', 'NY', 'EST', 'Database re-engage', 'old_lead', 1, 'What is this?', datetime('now', '-30 minutes'), 'queued'),
    ('Ethan', 'Roberts', '(404) 555-7890', 'ethan.r@email.com', 'GA', 'EST', 'Database re-engage', 'old_lead', 1, 'Maybe later this week', datetime('now', '-45 minutes'), 'parked');

-- Set parked lead details
UPDATE leads SET parked_until = datetime('now', '+3 hours'), parked_note = 'After 4pm PST — West Coast' WHERE first_name = 'Tyler';
UPDATE leads SET parked_until = datetime('now', '+1 day'), parked_note = 'Said later this week' WHERE first_name = 'Ethan';
