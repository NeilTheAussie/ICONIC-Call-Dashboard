# ICONIC In-House Call Dashboard — Project Specification

## What This Is

A real-time web dashboard for ICONIC's in-house video call sales operation. The system coordinates **Jill** (team manager), **8 viewers** (sales closers), and the **MMLN admin team** (Mike, Martin, Leanne, Neil) to process leads from four weighted pools through browser-based Daily.co video calls.

This is the command centre for a $270K/month operation that converts existing studio leads — zero ad spend — into ICONIC portfolio subscriptions.

---

## The Business Context

ICONIC by AI sells AI-powered modelling portfolio packages. The "In-House ICONIC" plan uses the existing studio photography business's lead flow (750,000+ historical leads + ongoing monthly) to sell ICONIC packages via browser-based video calls.

**ICONIC is formed by MMLN** (Mike, Martin, Leanne, Neil) to capture lost revenue from the current studio-based photography business. All reporting references to "MMLN" mean this founding team.

### The Four Lead Pools (All Free)

| Pool | Weight | Volume/Month | → Video Calls | Deal Rate | Sign-Ups |
|------|--------|-------------|---------------|-----------|----------|
| No-shows (booked studio, didn't turn up) | **5** | 1,000 in funnel | 150 | 60% | 90 |
| Booker transferred (handed directly to viewer) | **3** | 500 direct to call | 500 | 55% | 275 |
| Missed pitches (350/day, pitched but didn't buy) | **2** | 7,000 | 700 (10% on call) | 45% | 315 |
| Old leads (750K database + ongoing, AI re-engaged) | **1** | 5,000 say yes | 1,000 (20% on call) | 40% | 400 |
| **TOTAL** | | | **2,350** | **46% blended** | **1,080** |

**Weight** determines:
1. Queue priority (5 = front of line)
2. Viewer assignment (best closers get highest-weight leads)
3. AI sequence aggressiveness

**Daily call breakdown:** 109 calls/day — 7 from no-shows (6%), 23 from booker transfers (21%), 32 from missed pitches (30%), 46 from old leads (43%).

---

## Users & Roles

| Role | Who | Count | What They Do |
|------|-----|-------|-------------|
| **Viewer** | Sales closers | 8 (min), 9 recommended | Take video calls via Daily.co, run pitch, log outcomes, handle collections in idle time |
| **Manager** | Jill | 1 | Dashboard, queue management, breaks, stats, leaderboard, training, call reviews, weekly MMLN report |
| **Admin (MMLN)** | Mike, Martin, Leanne, Neil | 4 | Full visibility, user management, reporting, configuration, P&L |

### Auth
- Email/password login, JWT tokens (24hr expiry)
- Role assigned at account creation
- Admin can create/edit/deactivate users
- Jill (manager) can manage viewer settings but not admin settings

### Seed Users
| Email | Name | Role |
|-------|------|------|
| neil@stingrai.com | Neil | admin |
| mike@iconic.ai | Mike | admin |
| martin@iconic.ai | Martin | admin |
| leanne@iconic.ai | Leanne | admin |
| jill@iconic.ai | Jill | manager |
| viewer1@iconic.ai | Viewer 1 | viewer |
| viewer2@iconic.ai | Viewer 2 | viewer |
| ... up to viewer8 | ... | viewer |

---

## Core Screens

### 1. Manager Dashboard (Jill's View) — THE MAIN SCREEN

Jill lives here all day. She sees everything: who's available, what's in the queue, who's on a call, today's stats, and the leaderboard.

**Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│  ICONIC War Room                    [Today's Stats]    [Jill]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ TODAY'S NUMBERS ─────────────────────────────────────────┐   │
│  │ Calls: 74/109  │ Closes: 34  │ Rev: $8,058  │ Queue: 12  │   │
│  │ Deal Rate: 46% │ Avg Wait: 48s │ Promises: 17           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ VIEWER STATUS GRID (8 viewers) ──────────────────────────┐   │
│  │ [Sarah 🟢]  [Tom 🔴 2:14]  [Amy 🟢]  [Jake 🔴 0:45]    │   │
│  │ [Lisa 🟡]   [Dan 🟢]       [Mia 🔴 4:20]  [Chris ⚫]   │   │
│  │                                                            │   │
│  │ Available: 3  │  On Call: 3  │  Break: 1  │  Offline: 1  │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ LEAD QUEUE (sorted by weight then wait time) ────────────┐   │
│  │ ⚡5  Jessica M.   NO-SHOW     Replied 2m    [Route → ▼]  │   │
│  │ ⚡3  Marcus T.    BOOKER TX   Direct        [Route → ▼]  │   │
│  │ ●2   Aaliyah J.   MISSED      Replied 8m    [Route → ▼]  │   │
│  │ ●1   Brandon L.   OLD LEAD    Replied 15m   [Route → ▼]  │   │
│  │ ●1   Sophia D.    OLD LEAD    Replied 22m   [Route → ▼]  │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ LEADERBOARD ──────────┐  ┌─ PARKED / CALLBACKS ─────────┐   │
│  │ 1. Sarah  — 6 closes   │  │ Tyler W. — 4pm PST           │   │
│  │ 2. Tom    — 5 closes   │  │ Mia G.   — Tomorrow 10am     │   │
│  │ 3. Amy    — 4 closes   │  │ James K. — "after work"      │   │
│  │ ...                     │  │ ...                           │   │
│  └─────────────────────────┘  └───────────────────────────────┘   │
│                                                                  │
│  ┌─ OVERFLOW ALERTS ─────────────────────────────────────────┐   │
│  │ ⚠️ 3 leads waiting 90s+ │ 1 lead at 3min (SMS sent)      │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [📊 Payments]  [📋 Collections]  [🏋️ Training]  [⚙️ Settings] │
└──────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Viewer status grid: 🟢 Available, 🔴 On Call (with duration), 🟡 Break, ⚫ Offline
- Lead queue sorted by weight (highest first), then by wait time within same weight
- Route dropdown: shows only available viewers, auto-assigns to best performer for weight-5 leads
- Overflow alerts: leads waiting >90s get "You're next" SMS; >3min get apology + alert to part-timer
- Leaderboard: today's closes, revenue, deal rate per viewer
- Quick actions: direct outbound texting on slow days, collections assignments

### 2. Viewer Dashboard

What each viewer sees. Focused, single-lead, action-oriented. Must work on mobile.

```
┌──────────────────────────────────────────────────────────────────┐
│  ICONIC — Viewer Panel                    [Status: 🟢 Available] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  YOUR STATUS: [🟢 Available] [🟡 Break] [⚫ Done for Day]       │
│                                                                  │
│  ┌─ CURRENT LEAD ────────────────────────────────────────────┐   │
│  │  ⚡5  NO-SHOW                                              │   │
│  │  Jessica Martinez                                          │   │
│  │  📱 (310) 555-1234  ·  ✉️ jessica@email.com               │   │
│  │  📍 California · PST  ·  🌊 WEST COAST                    │   │
│  │  💬 "Yes I'm free!"                                        │   │
│  │  📝 Jill: "Super keen, replied within 1 min"               │   │
│  │                                                            │   │
│  │  [📞 START CALL]   [📋 PITCH DECK]                        │   │
│  │                                                            │   │
│  │  OUTCOME:                                                  │   │
│  │  [✅ Closed]  [🤝 Promise]  [📅 Follow Up]                │   │
│  │  [❌ Not Interested]  [👻 No Show]                         │   │
│  │                                                            │   │
│  │  IF CLOSED / PROMISE:                                      │   │
│  │  Payment tier: [PIF $700 ▼]                                │   │
│  │  Amount collected on call: [$___]                           │   │
│  │  Subscription set up: [Yes / No / Promise]                 │   │
│  │  Promise date (if promise): [___]                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ TODAY'S STATS ───────────────────────────────────────────┐   │
│  │ Calls: 9  │  Closes: 4  │  Revenue: $1,850               │   │
│  │ Deal Rate: 44%  │  Promises: 3  │  Collections: 2        │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ IDLE TIME TASKS ─────────────────────────────────────────┐   │
│  │ 🔄 Follow-up calls (3 pending) — 10% comm                │   │
│  │ 💰 Collections calls (5 overdue) — 10% comm              │   │
│  │ 📱 "Call me now" outbound texts                           │   │
│  │ 📚 Training: Review yesterday's calls                     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  UPCOMING CALLBACKS:                                             │
│  3:00 PM — Tina R. (follow-up)                                  │
│  4:30 PM — James K. (promise payment due)                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Big status toggle (reflected on Jill's screen in real time)
- Current lead card with weight badge and pool source
- "Start Call" opens Daily.co room (branded waiting room with 60-sec video)
- Outcome logging with payment tier selection
- **Promise tracking**: if outcome = promise, capture promised date + amount
- Idle time task panel: follow-ups, collections, outbound, training
- Callbacks section: parked leads + promise payment due dates

### 3. Payment Dashboard (Jill + Admin)

**THE BIGGEST REVENUE LEVER.** The 50% who sign up but don't pay on the call = ~$45K/month potential upside.

```
┌──────────────────────────────────────────────────────────────────┐
│  PAYMENTS & COLLECTIONS                         [This Month ▼]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ COLLECTION FUNNEL ───────────────────────────────────────┐   │
│  │ Sign-ups: 1,080  │  Paying: 540  │  Promises: 540         │   │
│  │ Promise → Paid: 135 (25%)  │  Never Paid: 405             │   │
│  │                                                            │   │
│  │ ████████████████████░░░░░░░  Promise-to-Pay: 25%          │   │
│  │ Target: 30% (+$9K)  │  Stretch: 40% (+$27K)              │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ OVERDUE PAYMENTS ────────────────────────────────────────┐   │
│  │ Jessica M. — $400 due Mar 28 — OVERDUE 3 DAYS — [Call]   │   │
│  │ Marcus T.  — $50 first payment promised Mar 30 — [Call]   │   │
│  │ Aaliyah J. — $24.99 weekly failed — card declined [SMS]   │   │
│  │ ...                                                        │   │
│  │ TOTAL OVERDUE: $12,450 across 34 accounts                │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ SUBSCRIPTION HEALTH ─────────────────────────────────────┐   │
│  │ Active subs: 412   │  Churned this month: 28              │   │
│  │ On reduced plan: 45  │  Paused: 18                        │   │
│  │ MRR: $42,500  │  Chargeback rate: 3.2%                   │   │
│  │ ⚠️ Flag if chargeback >8%                                 │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ AI SMS SEQUENCES ────────────────────────────────────────┐   │
│  │ Payment reminders active: 124                              │   │
│  │ Downgrade offers sent: 18                                  │   │
│  │ Reactivation campaigns: 6                                  │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 4. Admin Dashboard (MMLN View)

Everything Jill sees PLUS:
- User management (add/edit/deactivate viewers, set Jill's access)
- Full P&L view (revenue, viewer costs, Jill's comp, platform costs, gross margin)
- Weekly/monthly report generation (auto-generates Jill's Friday report for MMLN)
- Configuration: Daily.co settings, GHL API keys, Square integration
- Viewer compensation calculator (base + commission tiers)
- Historical reporting with charts (calls, closes, revenue, deal rates over time)
- Lead pool management (import, re-weight, archive)
- Jill's performance metrics (team deal rate, collections improvement, chargeback rate)

### 5. Daily.co Video Call Integration

**Daily.co, NOT Zoom/Whereby.** Client taps link → branded page → 60-sec waiting room video → call connects.

**Branded Waiting Room Video (60 seconds):**
- 0-8s: Brand intro
- 8-22s: Phantom memories (aspirational content)
- 22-38s: Before → after transformations
- 38-50s: Value stack
- 50-60s: Handoff ("Your consultant is joining now...")

**How it works:**
1. Lead clicks link (from SMS / GHL)
2. Opens branded waiting room page (no app, no download)
3. 60-sec video plays while viewer is alerted
4. Viewer joins → video stops → call begins
5. Call ends → viewer logs outcome in dashboard

**Technical:**
- Each viewer gets a persistent Daily.co room
- Admin configures room URLs in settings
- "Start Call" on viewer dashboard sends the room link to the lead AND opens the room for the viewer
- Daily.co webhook fires on call start/end → dashboard updates status automatically

---

## Data Model

### Users
```
id, email, password_hash, name, role (admin|manager|viewer),
status (available|on_call|break|offline),
status_changed_at, daily_room_url, is_active,
created_at, updated_at
```

### Leads
```
id, first_name, last_name, phone, email,
state, timezone, source,
pool (no_show|booker_transfer|missed_pitch|old_lead),
weight (5|3|2|1),
last_message, last_message_at,
ghl_contact_id,
status (queued|routed|waiting_room|on_call|closed|promise|
        follow_up|not_interested|no_show|parked),
parked_until, parked_note,
assigned_viewer_id,
routed_at, routed_by_id, routing_notes,
call_started_at, call_ended_at,
outcome, payment_tier, revenue_on_call (cents),
promise_amount (cents), promise_date,
subscription_status (active|pending|none),
notes, created_at, updated_at
```

### Payments
```
id, lead_id, viewer_id,
type (pif|deposit|weekly|biweekly|monthly|promise|collection),
amount (cents), status (collected|pending|overdue|failed|cancelled),
due_date, collected_date,
square_subscription_id, square_payment_id,
notes, created_at, updated_at
```

### Subscriptions
```
id, lead_id,
plan (full|portfolio_only|keep_alive|paused),
price_cents, frequency (weekly|biweekly|monthly),
square_subscription_id,
status (active|reduced|paused|cancelled|churned),
started_at, reduced_at, paused_at, cancelled_at,
instagram_upsell (none|keep_going|growth|full_management),
instagram_started_at,
created_at, updated_at
```

### Activity Log
```
id, user_id, lead_id, action, details (JSON), created_at
```

### Daily Stats (computed/cached)
```
date, viewer_id,
calls_total, calls_by_pool (JSON: {no_show: X, booker: Y, ...}),
closes, promises, follow_ups, not_interested, no_shows,
revenue_on_call (cents), promise_amount (cents),
collections_made, collections_amount (cents),
deal_rate, avg_call_duration
```

---

## Queue Priority System

Leads are sorted in the queue by:
1. **Weight** (descending): 5 → 3 → 2 → 1
2. **Wait time** (ascending within same weight): longest waiting first
3. **Overflow rule**: any lead waiting >90s gets bumped to top regardless of weight

**Auto-assignment logic (optional, Jill can override):**
- Weight-5 leads → top-performing viewer (by deal rate)
- Weight-3 leads → next available viewer
- Weight-2 and 1 → round-robin across available viewers
- Jill can always manually route any lead to any available viewer

---

## Payment Structure

All payments set up as **subscriptions in Square**. Contract states "subscribing to a service." Client can cancel anytime → everything turns off.

| Tier | % of Sign-ups | Pays on Call | Remaining | Collection (30%) | Total Rev Each |
|------|--------------|-------------|-----------|-----------------|---------------|
| Pay in full | 5% | $700 | $0 | — | $700 |
| $400 deposit (2×$400) | 5% | $400 | $400 recurring | $120 | $520 |
| Weekly $24.99 | 15% | $24.99 | $975 recurring | $293 | $317 |
| Biweekly $49.99 | 15% | $49.99 | $950 recurring | $285 | $335 |
| $100 + $99/month | 10% | $100 | $890 recurring | $267 | $367 |
| Promise → converts | 12.5% | $0 | $950 (after $50 first) | $335 | $335 |
| Promise → never pays | 37.5% | $0 | $0 | $0 | $0 |

**Revenue per sign-up: $237**
**Immediate cash on call per 100 sign-ups: $7,625**
**Total collected per 100 sign-ups: $23,738**

---

## Reduced Payment Plans (Churn Prevention)

AI handles downgrades automatically. Recovers ~$14K/month.

| Plan | Price | They Keep | Turned Off |
|------|-------|-----------|------------|
| Full | $24.99/wk | Everything | Nothing |
| Portfolio Only | $14.99/wk | Portfolio, website, Z-card | Instagram paused |
| Keep Alive | $9.99/wk | Portfolio access only | IG, website, Z-card |
| Paused | $0 | Nothing | Everything |

---

## Instagram Upsell (Post Month 3)

20% of clients take Instagram after 3 free months:
- Keep It Going: $49/month (50% uptake)
- Growth: $79/month (35% uptake)
- Full Management: $149/month (15% uptake)
- Weighted average: $74/month

---

## Overflow Handling

| Wait Time | Action |
|-----------|--------|
| 90 seconds | SMS: "You're next" |
| 3 minutes | SMS: "Sorry for the wait, you're front of queue" + alert Jill to assign part-timer |
| Left/abandoned | Priority re-entry link sent via SMS |

---

## Idle Time / Outbound (Viewer Priority Order)

1. Follow-up calls (10% commission)
2. Collections calls (10% commission)
3. "Call me now" outbound texting
4. QA + training

---

## 14-Day Missed Pitch Follow-Up

- **Track 1** (didn't buy): 9 touchpoints — 3 videos, 2 viewer callbacks, social proof, AI texts
- **Track 2** (left queue): Priority re-entry → merge Track 1 at Day 7
- **Track 3** (never clicked): Re-send → Video 1 → merge Track 1 at Day 3

---

## Viewer Compensation

$30K base + 15% of immediate cash on the call + 5% of all recurring/scheduled collections + 15% of Instagram subscription revenue.

Monthly: ~$5,100 in Month 1, growing to ~$5,270 by Month 12 (IG residual). Annual: ~$63K.

---

## Jill's Compensation

$60K retainer + 2.5% of total team revenue, capped at $140K total comp.

---

## Real-Time Requirements

SSE (Server-Sent Events) for real-time updates across all connected dashboards:
- Viewer status changes → Jill sees instantly
- Lead routed → Viewer sees instantly
- Outcome logged → Stats update everywhere
- Queue changes → All views refresh
- Payment events → Payment dashboard updates
- Overflow alerts → Jill gets instant notification

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite + Tailwind CSS | Fast, Martin knows React |
| Backend | Node.js + Express | Simple, Martin knows it |
| Database | SQLite (better-sqlite3) → PostgreSQL | SQLite for MVP, Postgres for production |
| Real-time | Server-Sent Events (SSE) | Simple, sufficient for 10-15 concurrent users |
| Auth | JWT tokens (24hr expiry) | Standard, stateless |
| Video calls | Daily.co API | Browser-based, branded waiting room, webhooks |
| Payments | Square API (subscriptions) | Already used by the studio |
| CRM/SMS | GoHighLevel API + webhooks | Already in use |
| Hosting | Railway or Render | Simple deploy |

---

## GHL Integration

- **Inbound webhook**: GHL fires webhook when lead replies → lead auto-appears in queue with pool/weight
- **Outbound API**: Update tags, sync status, trigger SMS sequences
- **Auto-tagging**: closed → tag in GHL; promise → tag + reminder sequence; no-show → re-engage sequence

---

## API Endpoints

```
POST   /api/auth/login                    → { token, user }
POST   /api/auth/logout

GET    /api/leads?status=queued           → lead queue (sorted by weight + wait time)
POST   /api/leads                         → add lead manually
POST   /api/leads/import                  → CSV/bulk upload
PATCH  /api/leads/:id/route               { viewer_id, notes }
PATCH  /api/leads/:id/park                { parked_until, note }
PATCH  /api/leads/:id/outcome             { outcome, payment_tier, revenue_on_call, promise_amount, promise_date, subscription_status, notes }
PATCH  /api/leads/:id/unpark
GET    /api/leads/export                  → CSV

GET    /api/users                         → all users
POST   /api/users                         → create user (admin/manager)
PATCH  /api/users/:id                     → update user
PATCH  /api/users/:id/status              { status }

GET    /api/payments                      → all payments (filterable)
GET    /api/payments/overdue              → overdue payments
GET    /api/payments/promises             → promise tracker
PATCH  /api/payments/:id                  → update payment status
GET    /api/payments/stats                → collection funnel metrics

GET    /api/subscriptions                 → all subscriptions
GET    /api/subscriptions/health          → churn, MRR, reduced plans, chargebacks
PATCH  /api/subscriptions/:id/reduce      { new_plan }
PATCH  /api/subscriptions/:id/pause
PATCH  /api/subscriptions/:id/cancel

GET    /api/stats/today                   → today's numbers (all viewers)
GET    /api/stats/viewer/:id/today        → single viewer today
GET    /api/stats/range?from=&to=         → date range
GET    /api/stats/leaderboard             → ranked viewers
GET    /api/stats/pnl?month=              → P&L for month

GET    /api/activity                      → activity log
GET    /api/events                        → SSE stream

POST   /api/daily/webhook                 → Daily.co call start/end webhook
POST   /api/ghl/webhook                   → GHL lead reply webhook
POST   /api/square/webhook                → Square payment webhook
```

---

## Environment Variables

```
DATABASE_URL=sqlite:./data/iconic.db
JWT_SECRET=<random-string>
PORT=3000
NODE_ENV=development

# Daily.co
DAILY_API_KEY=<from daily.co dashboard>
DAILY_DOMAIN=iconic.daily.co

# Square
SQUARE_ACCESS_TOKEN=<from square dashboard>
SQUARE_ENVIRONMENT=sandbox  # or production
SQUARE_WEBHOOK_SIGNATURE_KEY=<from square>

# GoHighLevel
GHL_API_KEY=<from GHL>
GHL_LOCATION_ID=<from GHL>
GHL_WEBHOOK_SECRET=<random-string>

# Admin
ADMIN_EMAIL=neil@stingrai.com
```

---

## File Structure

```
iconic-call-dashboard/
├── CLAUDE.md
├── PROJECT_SPEC.md
├── package.json
├── .env.example
│
├── server/
│   ├── index.js
│   ├── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── leads.js
│   │   ├── users.js
│   │   ├── payments.js
│   │   ├── subscriptions.js
│   │   ├── stats.js
│   │   ├── events.js              # SSE
│   │   └── webhooks.js            # Daily.co + GHL + Square
│   ├── db/
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── db.js
│   └── services/
│       ├── leadService.js
│       ├── queueService.js        # Weight-based queue logic
│       ├── paymentService.js
│       ├── subscriptionService.js
│       ├── statsService.js
│       ├── dailyService.js        # Daily.co room management
│       ├── ghlService.js          # GHL API calls
│       ├── squareService.js       # Square subscription management
│       └── eventBus.js            # SSE broadcaster
│
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── EventContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── ManagerDashboard.jsx
│   │   │   ├── ViewerDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── PaymentDashboard.jsx
│   │   │   └── ReportingPage.jsx
│   │   └── components/
│   │       ├── LeadCard.jsx
│   │       ├── ViewerStatusGrid.jsx
│   │       ├── StatsBar.jsx
│   │       ├── Leaderboard.jsx
│   │       ├── QueueList.jsx
│   │       ├── ParkLeadModal.jsx
│   │       ├── OutcomeModal.jsx
│   │       ├── PaymentTracker.jsx
│   │       ├── CollectionsFunnel.jsx
│   │       ├── SubscriptionHealth.jsx
│   │       ├── OverflowAlert.jsx
│   │       ├── IdleTaskPanel.jsx
│   │       ├── UserManagement.jsx
│   │       └── PnLView.jsx
│   └── tailwind.config.js
│
└── data/
    └── .gitkeep
```

---

## MVP Feature Checklist

### Must Have (Week 1 — Claude Code Sessions 1-3)
- [ ] Login/auth for all users (admin, manager, viewer roles)
- [ ] Manager dashboard: viewer status grid, lead queue with weight sorting, route buttons
- [ ] Viewer dashboard: current lead card, status toggle, outcome logging with payment tier
- [ ] Real-time SSE sync across all dashboards
- [ ] Queue priority by weight (5/3/2/1) then wait time
- [ ] Add lead manually (name, phone, pool, weight)
- [ ] Daily.co integration: "Start Call" opens branded room
- [ ] Outcome logging: closed, promise, follow-up, not interested, no show
- [ ] Promise tracking: capture promise date + amount
- [ ] Today's stats bar (calls, closes, revenue, deal rate, promises)
- [ ] Leaderboard (today, this week)
- [ ] Park lead with callback time
- [ ] Overflow alerts (90s, 3min)
- [ ] Basic activity log

### Should Have (Week 2)
- [ ] Payment dashboard: overdue tracker, promise-to-pay funnel, collection assignments
- [ ] GHL webhook integration (auto-add replied leads with pool/weight)
- [ ] Square webhook integration (payment success/failure events)
- [ ] Subscription health view (MRR, churn, reduced plans, chargebacks)
- [ ] Viewer idle time task panel
- [ ] CSV lead import/export
- [ ] Notification sound for new leads
- [ ] West Coast timezone flagging
- [ ] Weekly report auto-generation (for Jill's Friday MMLN report)
- [ ] Viewer compensation calculator

### Nice to Have (Phase 2)
- [ ] Daily.co branded waiting room with 60-sec video
- [ ] Daily.co call recording integration
- [ ] Square subscription creation from dashboard
- [ ] Reduced plan management (auto-downgrade flows)
- [ ] Instagram upsell tracking
- [ ] 14-day missed pitch follow-up sequence management
- [ ] Historical P&L reporting with charts
- [ ] Mobile app for viewers

---

## P&L — 8 Viewers + Jill

| Line | Monthly |
|------|---------|
| Revenue (weighted 46% deal rate) | $256,365 |
| + Reduced plan retention | $14,000 |
| **Adjusted revenue** | **$270,365** |
| Viewer base (8 × $2,500) | ($20,000) |
| Viewer commission | ($14,700) |
| Jill ($60K + 2.5% capped) | ($11,759) |
| Platform + IG delivery | ($2,500) |
| **Gross Margin** | **$221,406** |
| **Margin %** | **81.9%** |

---

## Design Direction

- **Theme**: Dark, professional, utilitarian — Bloomberg terminal meets Slack
- **Primary**: ICONIC purple (#7C3AED) for accents
- **Background**: Dark charcoal (#0F0F14 / #1A1A24)
- **Pool colours**: No-show = Red (#EF4444), Booker = Orange (#F97316), Missed = Blue (#3B82F6), Old = Gray (#6B7280)
- **Status**: Green (#22C55E) available, Red (#EF4444) on call, Yellow (#EAB308) break, Gray (#6B7280) offline
- **Weight badges**: ⚡5 = bright red, ⚡3 = orange, ●2 = blue, ●1 = gray
- **Typography**: System fonts, monospace for stats/numbers
- **Animations**: Minimal — pulse on new lead, smooth status transitions, overflow shake
- **Sound**: Configurable ping/chime for new leads and overflow alerts

---

## Success Criteria

1. Jill can see all 8 viewers' status at a glance and route leads in under 5 seconds
2. Viewer sees routed lead within 2 seconds via SSE
3. Queue correctly prioritises weight-5 leads above all others
4. Daily.co call connects with branded waiting room — no downloads
5. Payment dashboard shows promise-to-pay conversion rate and overdue amounts
6. Overflow alerts fire at 90s and 3min
7. Today's stats (calls, closes, revenue, deal rate) visible on every screen
8. Leaderboard drives viewer competition
9. Works on mobile (viewer dashboard)
10. Weekly report exportable for MMLN
