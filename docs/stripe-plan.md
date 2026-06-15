# Stripe integration — target architecture (NOT built yet)

Status: **planned**. The current payment flow is MOCK-ONLY (see the `⚠️ MOCK-ONLY`
block at the top of `src/app/p/[slug]/actions.ts`). This document is the agreed
target design for when we wire up real Stripe payments. Nothing here is applied
yet — in particular, **do not change RLS policies until the Stripe code lands**.

## Hardening already done (pre-Stripe)

- `submitMockPayment` reads `amount` from `collections.amount` in the DB, never
  from the form. The hidden `amount` input was removed from both `PaymentForm.tsx`
  and `RosterPaymentFlow.tsx` — the client cannot influence the recorded amount.
- The action is annotated as mock-only with the migration checklist below.

## Target flow (two phases instead of one)

```
Payer clicks "Betala"
  └─ submitPayment (anon, server action)
       1. look up collections.amount (server-side, as now)
       2. INSERT payments row  status='pending'  (no paid_at, no flip)
       3. create Stripe Checkout Session for that amount,
          metadata: { payment_id, collection_id, collection_member_id }
       4. return session.url → client redirects to Stripe
  ┄┄ payer pays on Stripe's hosted page ┄┄
Stripe → POST /api/stripe/webhook  (checkout.session.completed)
       1. verify signature
       2. UPDATE payments SET status='paid', paid_at=now,
          stripe_payment_intent_id=… WHERE id = metadata.payment_id
       3. (sync_collection_member_paid trigger fires automatically)
```

## 1. Which table the webhook writes to

Only `payments`. A targeted
`UPDATE payments SET status='paid', paid_at, stripe_payment_intent_id
WHERE id = <metadata.payment_id>`. It never touches `collection_members`
directly — that stays the trigger's job. The `stripe_payment_intent_id` column
already exists (null for mocks), so no migration needed for it.

## 2. Webhook signature authentication

Route: `src/app/api/stripe/webhook/route.ts`.

- Read the **raw** request body (`await req.text()`, NOT parsed JSON) plus the
  `Stripe-Signature` header, and call
  `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`.
  Signature verification fails if the body is parsed/re-serialized first.
- On verification failure: return 400 and write nothing.
- Use the **service-role** Supabase client — the webhook is a trusted
  server-to-server call with no user session, so it bypasses RLS to perform the
  `paid` write.
- New server-only env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
  Set them BOM-free from git-bash, never via PowerShell pipes (a leading U+FEFF
  BOM silently breaks header auth — this already cost us a multi-cycle 404 debug
  on the Supabase keys).

## 3. How the existing `sync_collection_member_paid` trigger fits in

**No changes to the trigger.** It fires `after insert or update of status on
payments` and flips the linked `collection_member` to `paid` as SECURITY
DEFINER. Today it fires on the mock INSERT(paid); under Stripe it fires on the
webhook's UPDATE(pending→paid). The anon payer never needs UPDATE rights on
`collection_members`, and neither does the webhook beyond `payments`. The seam
is already in the right place — this is the payoff of the SECURITY DEFINER
design.

## 4. Required RLS change (TARGET — do NOT apply yet)

Today `payments: public insert` lets the anon role insert a row with **any**
status, including `'paid'` → anyone with the link can mark anyone paid.
Acceptable only while payments are mock/fictional. When Stripe lands, restrict
the anon insert to `pending` only:

```sql
-- TARGET policy — apply only when the Stripe webhook code is in place.
-- Replaces the current "payments: public insert".
drop policy if exists "payments: public insert" on payments;
create policy "payments: public insert pending only"
  on payments for insert
  with check (
    status = 'pending'
    and exists (
      select 1 from collections
      where collections.id = payments.collection_id
        and collections.status = 'active'
    )
  );
```

After this change, `paid` can only originate from:
- (a) the signature-verified Stripe webhook (service-role, RLS-exempt), or
- (b) an authenticated treasurer via the existing `payments: treasurer update`
  policy (manual "mark as paid").

Never from the anon link. This is the single most important security change of
the Stripe migration.

## Migration checklist (mirrors the actions.ts MOCK-ONLY block)

- [ ] `status:'paid'` set ONLY by the verified webhook — never the action or any
      client/anon path.
- [ ] Anon action inserts `status:'pending'` + creates a Checkout Session.
- [ ] Apply the `payments: public insert pending only` RLS policy above.
- [ ] Add `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (BOM-free).
- [ ] Verify `sync_collection_member_paid` still fires on the webhook UPDATE
      (no trigger change expected).
