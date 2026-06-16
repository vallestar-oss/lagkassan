@AGENTS.md

## Database schema

The schema lives **only** in `supabase/migrations/*.sql`, applied in filename
order. That is the single source of truth — there is no `schema.sql` snapshot
(it was deleted because it drifted out of sync). To understand the current
schema, read the migrations in order; the latest state is the sum of all of
them. When changing the schema, add a new timestamped migration — never edit an
applied one.

## Test account

Use this account for all browser/preview testing. Never ask the user for their personal credentials.

- **Email**: test@lagkassan.dev
- **Password**: TestLagk2026!
- **Role**: owner of "IFK Testklubben" (created 2026-06-15)

## Payments

The payment flow is **MOCK-ONLY** — `submitMockPayment` in
`src/app/p/[slug]/actions.ts` writes `status:'paid'` directly with no real
charge. Before integrating Stripe, read [docs/stripe-plan.md](docs/stripe-plan.md):
the agreed target architecture, including the planned `payments: public insert
pending only` RLS policy that must replace the current open insert policy.
Do not apply that RLS change until the Stripe webhook code is in place.
