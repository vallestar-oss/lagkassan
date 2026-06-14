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

  // Mock: write a payment row directly as "paid" (no Stripe yet).
  // When Stripe is connected, this becomes: create PaymentIntent → redirect → webhook marks paid.
  const { error } = await supabase.from("payments").insert({
    collection_id: collectionId,
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
