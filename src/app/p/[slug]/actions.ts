"use server";

import { createClient } from "@/lib/supabase/server";

export type PaymentState = { error: string | null; success: boolean };

export async function submitMockPayment(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const supabase = await createClient();

  const collectionId = (formData.get("collection_id") as string | null) ?? "";
  const amountRaw = formData.get("amount");
  const payerName = (formData.get("payer_name") as string | null)?.trim() ?? "";
  const payerEmail = (formData.get("payer_email") as string | null)?.trim() || null;
  const collectionMemberId = (formData.get("collection_member_id") as string | null) || null;

  if (!payerName) return { error: "Ange ditt namn.", success: false };
  if (!collectionId) return { error: "Ogiltig förfrågan.", success: false };

  const amount = parseInt(amountRaw as string, 10);
  if (isNaN(amount) || amount <= 0) return { error: "Ogiltigt belopp.", success: false };

  // Verify the collection is still active before inserting.
  const { data: collection } = await supabase
    .from("collections")
    .select("status")
    .eq("id", collectionId)
    .single();

  if (!collection || collection.status !== "active")
    return { error: "Den här betalningsförfrågan är inte längre aktiv.", success: false };

  // Server-side double-payment guard: if this member already paid, reject.
  if (collectionMemberId) {
    const { data: member } = await supabase
      .from("collection_members")
      .select("status")
      .eq("id", collectionMemberId)
      .single();
    if (member?.status === "paid")
      return { error: "Den här personen har redan betalat.", success: false };
  }

  // Mock: write a payment row directly as "paid" (no Stripe yet).
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

  if (error) return { error: "Kunde inte registrera betalningen. Försök igen.", success: false };

  return { error: null, success: true };
}
