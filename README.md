# Lagkassan

A payment collection tool for Swedish teams, clubs and associations.

---

## Problem

Collecting payments in sports clubs and community associations is painful. Organizers chase members via WhatsApp, manually track who has paid in a spreadsheet, and send reminders one by one. There is no shared link, no live status, and no single source of truth.

## Solution

Lagkassan lets an organizer create a payment request in seconds, share one public link, and see an updated overview of which members have marked their payment. Members open the link, select their name from a roster, and complete a simulated payment flow — no account required on their end.

## Core Features

- **Payment collections** — an organizer creates a collection with a title, amount and member roster
- **Public payment link** — one shareable URL per collection; anyone with the link can access the simulated payment page
- **Roster-based selection** — members pick their own name; the server controls which names are available
- **Status dashboard** — organizer sees paid / unpaid per member with an updated overview on each page load
- **Team management** — organizers manage multiple teams and their rosters
- **Auth-gated dashboard** — only authenticated organizers can create collections or view results

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| UI | React, Tailwind CSS |
| Database & Auth | Supabase (PostgreSQL + Row-Level Security) |
| Language | TypeScript |
| Deployment | Vercel |

## Architecture

```
Browser
  │
  ├── /dashboard, /teams, /collections  → auth-gated, server-rendered
  │     └── Server Actions mutate DB directly (no REST layer)
  │
  └── /p/[slug]  → public payment page
        └── Server Action: submitMockPayment
              • reads collection amount from DB (client never sets it)
              • validates member belongs to this collection
              • writes payment record with status = 'paid'
```

**Key design decisions:**

- **Amount is server-authoritative.** The client submits only a member ID; the server looks up the collection amount. The payment amount is not accepted from the client — the server reads it from the collection record in the database.
- **Server Actions over API routes** for mutations — keeps auth context close to the database call.
- **Row-Level Security on all tables** — dashboard data is scoped to the authenticated organizer; public payment page has its own narrow policy.
- **Slug-based public URLs** — collections are identified by a random slug, not a sequential ID, to avoid enumeration.

## Security Considerations

The current mock architecture was designed with a future real-money version in mind:

- The client never controls payment amount, member list, or collection status.
- All mutations go through authenticated Server Actions or narrow public policies.
- The public payment endpoint validates that the selected member belongs to the correct collection before writing.
- RLS policies are the primary access-control layer; application-level checks are a secondary guard.

**Known gaps before real money could be involved:**

- The `payments` table currently allows public insert with `status = 'paid'`. In a real Stripe integration this policy must be restricted to `status = 'pending'` only, with paid status set exclusively by a verified Stripe webhook.
- Public payment links are convenient but require rate limiting, idempotency keys, and fraud controls before production use.
- No email confirmation or receipt flow exists yet.

## Mock Payment Notice

> **Payments are simulated.** No real money is collected. The payment flow writes a `status = 'paid'` record directly to the database to demonstrate the UX. This is intentional for portfolio/demo purposes and is clearly documented in the codebase. Real Stripe integration is planned (see roadmap).

## AI-Assisted Development

This project was built with AI-assisted development (Claude). Responsibilities were split deliberately:

- **AI-generated:** boilerplate, UI layout, Tailwind styling, repetitive CRUD logic
- **Manually reviewed:** security model, RLS policies, payment flow, schema design, all product decisions

The goal was to move fast without outsourcing judgment on the parts that matter.

## Local Setup

**Prerequisites:** Node.js 18+, a Supabase project, `.env.local` with the keys below.

```bash
git clone <repo>
cd lagkassan
npm install
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Apply migrations:
```bash
npx supabase db push   # or apply supabase/migrations/*.sql in order
```

Run dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a local test account through the signup flow.

## Future Roadmap

- [ ] **Real Stripe integration** — webhook-verified paid status, no client trust
- [ ] **Email receipts** — confirmation to payer after successful payment
- [ ] **Partial payments / instalments** — pay in multiple rounds
- [ ] **Reminder automation** — scheduled nudges to unpaid members
- [ ] **Multi-currency support** — currently SEK only
- [ ] **Exportable reports** — CSV download of payment status per collection
