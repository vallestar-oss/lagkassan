"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export type PaymentState = { error: string | null; success: boolean };

// =============================================================================
// ⚠️  MOCK-ONLY PAYMENT ACTION — DO NOT SHIP TO REAL MONEY AS-IS  ⚠️
// -----------------------------------------------------------------------------
// This action fakes a successful payment by inserting a payments row with
// status:'paid'. There is NO real charge and NO verification that money
// moved. It exists so the app flow is testable before Stripe is wired up.
//
// SECURITY MODEL TODAY: the anon role has zero direct table privileges (see
// migration 20260707000000_lock_down_anon_access) — there is no public RLS
// insert policy to abuse. This service-role action is the sole gatekeeper for
// the write, and it validates the collection is active, the member belongs to
// THIS collection, and the member is still unpaid before writing. `amount` is
// read from the DB (collections.amount), never the form, so a tampered client
// cannot set an arbitrary amount. The remaining gap is purely that this action
// itself writes status:'paid' on a self-report with no external verification
// — acceptable only because no real money is involved yet.
//
// WHAT MUST CHANGE WHEN STRIPE IS ADDED — non-negotiable:
//   (a) status:'paid' must ONLY ever be set by a verified Stripe webhook
//       (signature-checked, service-role). NEVER by this action, and NEVER by
//       any client/anon code path.
//   (b) This action's job becomes: insert a status:'pending' payment row and
//       create a Stripe Checkout Session for collections.amount, then return the
//       session URL for redirect. The webhook (checkout.session.completed /
//       payment_intent.succeeded) is what flips the row to 'paid', which in turn
//       fires sync_collection_member_paid to mark the collection_member paid.
//       See the Stripe webhook plan for the full target design.
//
// Until (a)-(b) land, treat every "paid" here as fictional.
// =============================================================================

export async function submitMockPayment(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  // The anon role has no direct table access (see migration
  // 20260707000000_lock_down_anon_access). This public write path runs through
  // the service-role client and is the sole gatekeeper: it validates the
  // collection is active, the member belongs to THIS collection, and the member
  // is still unpaid. It only ever writes payment_method:'card' (a self-report →
  // reported_paid); it never writes 'manual', so it cannot forge a treasurer
  // confirmation. When Stripe lands, this becomes insert-pending + Checkout and
  // the webhook (service-role) is the only writer of 'paid'.
  // Public, unauthenticated write path — anyone with the link can call this
  // repeatedly. A per-IP cap keeps a scripted spam loop from flooding the
  // database with junk payment rows.
  const ip = await getClientIp();
  const { ok, retryAfterSeconds } = rateLimit(`submit-payment:${ip}`, 10, 60_000);
  if (!ok) {
    return {
      error: `För många försök. Vänta ${retryAfterSeconds} sekunder och försök igen.`,
      success: false,
    };
  }

  const supabase = createAdminClient();

  const collectionId = (formData.get("collection_id") as string | null) ?? "";
  const payerName = (formData.get("payer_name") as string | null)?.trim() ?? "";
  const payerEmail = (formData.get("payer_email") as string | null)?.trim() || null;
  const collectionMemberId = (formData.get("collection_member_id") as string | null) || null;

  if (!payerName) return { error: "Ange ditt namn.", success: false };
  if (!collectionId) return { error: "Ogiltig förfrågan.", success: false };

  // Amount is the source of truth from the DB — NEVER from the form. The client
  // cannot influence what gets charged/recorded; a tampered hidden field is
  // ignored. This also stays correct once Stripe creates the Checkout Session
  // from this same server-side amount.
  const { data: collection } = await supabase
    .from("collections")
    .select("status, amount, slug")
    .eq("id", collectionId)
    .single();

  if (!collection || collection.status !== "active")
    return { error: "Den här betalningsförfrågan är inte längre aktiv.", success: false };

  const amount = collection.amount;

  // Verify the member actually belongs to THIS collection — without this
  // check, a tampered client could pair a collection_member_id from a
  // completely different collection with this collectionId, and the sync
  // trigger would flip that unrelated member's status.
  if (collectionMemberId) {
    const { data: member } = await supabase
      .from("collection_members")
      .select("status")
      .eq("id", collectionMemberId)
      .eq("collection_id", collectionId)
      .single();
    if (!member) return { error: "Ogiltig deltagare för den här förfrågan.", success: false };
    // Fast-path double-payment guard — the real guard against the race is the
    // partial unique index idx_one_paid_per_member (handled on insert below).
    if (member.status !== "unpaid")
      return { error: "Den här personen har redan betalat.", success: false };
  }

  // MOCK: write a payment row directly as "paid" (no Stripe yet).
  // ⚠️ When Stripe lands, this insert becomes status:'pending' + a Checkout
  // Session; the webhook is the only thing allowed to set 'paid'. See the
  // MOCK-ONLY block above.
  // The SECURITY DEFINER trigger on payments flips the linked
  // collection_member's status to 'paid' automatically.
  const { error } = await supabase.from("payments").insert({
    collection_id: collectionId,
    collection_member_id: collectionMemberId,
    payer_name: payerName,
    payer_email: payerEmail,
    amount,
    status: "paid",
    payment_method: "card",
    paid_at: new Date().toISOString(),
  });

  if (error) {
    // 23505 = unique_violation from idx_one_paid_per_member: another payment
    // for this member won the race. Treat as "already paid", not a failure.
    if (error.code === "23505")
      return { error: "Den här personen har redan betalat.", success: false };
    return { error: "Kunde inte registrera betalningen. Försök igen.", success: false };
  }

  // Mark both the public page and the organizer's collection page stale so
  // the next load (or the organizer's auto-refresh poll) picks up the report.
  revalidatePath(`/p/${collection.slug}`);
  revalidatePath(`/collections/${collectionId}`);

  return { error: null, success: true };
}
