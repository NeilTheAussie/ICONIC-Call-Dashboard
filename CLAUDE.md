# ICONIC In-House Call Dashboard — Claude Code Rules

## Project Overview
Real-time war room dashboard for ICONIC by AI's in-house sales operation. Manager (Jill) coordinates 8 viewers (closers) processing leads from four weighted pools through Daily.co browser video calls. Payment tracking, collections, subscriptions, leaderboard, P&L reporting. $270K/month operation.

## Tech Stack
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3) for dev, PostgreSQL-ready
- Real-time: Server-Sent Events (SSE)
- Auth: JWT (jsonwebtoken + bcryptjs)
- Video: Daily.co API (browser-based, branded waiting room)
- Payments: Square API (subscriptions)
- CRM/SMS: GoHighLevel API + webhooks

## Key Principles
- Speed over perfection — MVP in 3 Claude Code sessions
- Real-time is critical — SSE must work for 10-15 concurrent users
- Mobile-friendly viewer dashboard (viewers may be on phones)
- Dark theme (#0F0F14 bg), ICONIC purple (#7C3AED) accents
- Queue priority by weight (5/3/2/1) is a core business rule

## Roles
- **admin** (MMLN: Mike, Martin, Leanne, Neil) — sees everything, manages users, P&L
- **manager** (Jill) — viewer grid, queue, routing, payments, leaderboard, weekly reports
- **viewer** (8 closers) — single-lead view, status toggle, outcome logging, idle tasks

## Database
- Use better-sqlite3 (synchronous, fast, zero config)
- Schema in server/db/schema.sql — includes leads, payments, subscriptions tables
- Revenue stored as integers (cents) to avoid float issues
- All timestamps ISO 8601 UTC

## Queue Logic (CRITICAL)
- Leads sorted by weight DESC, then wait time ASC within same weight
- Weight 5 (no-shows) always at top of queue
- Overflow: any lead waiting >90s gets SMS "You're next"; >3min gets apology SMS + alert to Jill
- Jill can manually override any auto-routing
- Auto-assign: weight-5 → best performer, weight-3 → next available, weight-2/1 → round-robin

## Routing Flow
1. Lead enters queue (via GHL webhook, manual add, or CSV import)
2. Jill (or auto-assign) routes lead to available viewer
3. Server checks viewer status === 'available' (reject if not, 409 Conflict)
4. Lead status → 'routed', SSE broadcasts lead_routed
5. Viewer clicks "Start Call" → Daily.co room opens → lead status → 'on_call', viewer status → 'on_call'
6. Daily.co webhook fires on call end → viewer logs outcome
7. Outcome includes: result, payment tier, amount collected, promise details, subscription setup
8. Lead gets final status, viewer status → 'available', SSE broadcasts

## Outcome Types
- **closed** — signed up AND paid something on the call
- **promise** — signed up, promised to pay later (capture date + amount)
- **follow_up** — interested but not ready
- **not_interested** — declined
- **no_show** — didn't join the call

## Payment Tiers (log on outcome)
- PIF $700, Deposit $400 (2×$400), Weekly $24.99, Biweekly $49.99, Monthly $100+$99/mo, Promise

## Important Business Rules
- A viewer can only have ONE active lead at a time
- Everyone is onboarded regardless of payment status
- "Recurring" = card on file, auto-charges. "Promise" = no card, scheduled.
- 30% of total owed = realistic collection rate for recurring
- 25% effective collection on promises ($50 first payment → subscription at 30%)
- Chargeback rate >8% = investigate (flag on dashboard)
- All payments are subscriptions — "subscribing to a service"
- Reduced plans: Full → Portfolio Only → Keep Alive → Paused (AI handles)

## Don't
- Don't over-engineer — useContext + useReducer, no Redux
- Don't add features not in PROJECT_SPEC.md
- Don't use external UI component libraries — Tailwind only
- Don't implement Daily.co branded waiting room video in MVP — just the room connection
- Don't build Square subscription creation in MVP — just log the tier/amount
- Don't build the 14-day follow-up sequence manager — that lives in GHL
- Don't add chat/messaging — GHL handles SMS

## Testing
- Test SSE with 5+ browser tabs open (simulate full team)
- Test queue ordering with mixed-weight leads
- Test routing rejection when viewer is on_call
- Test overflow timing (90s, 3min alerts)
- Seed data: include leads from all 4 pools with correct weights
