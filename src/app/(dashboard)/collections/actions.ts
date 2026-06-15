"use server";

import { createClient } from "@/lib/supabase/server";
import { parseSekToOre } from "@/lib/utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type CollectionState = { error: string | null };

export async function createCollection(
  _prev: CollectionState,
  formData: FormData,
): Promise<CollectionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inte inloggad." };

  const teamId = (formData.get("team_id") as string | null) ?? "";
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const amountStr = (formData.get("amount") as string | null) ?? "";
  const deadline = (formData.get("deadline") as string | null) ?? "";

  if (!title) return { error: "Rubrik är obligatorisk." };
  if (!amountStr || isNaN(parseFloat(amountStr.replace(",", "."))))
    return { error: "Ange ett giltigt belopp." };

  const amount = parseSekToOre(amountStr);
  if (amount <= 0) return { error: "Beloppet måste vara större än 0 kr." };

  const { data: collection, error } = await supabase
    .from("collections")
    .insert({
      team_id: teamId,
      created_by: user.id,
      title,
      description: description || null,
      amount,
      deadline: deadline || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !collection) return { error: error?.message ?? "Kunde inte skapa förfrågan." };

  // Copy selected roster names + any extra names into collection_members.
  // If none are selected the collection is created without members (fallback
  // to free-form payment page — see /p/[slug]).
  const memberNames = formData.getAll("member_name") as string[];
  const extraNames = (formData.getAll("extra_name") as string[])
    .map((n) => n.trim())
    .filter(Boolean);
  const allNames = [...memberNames, ...extraNames];

  if (allNames.length > 0) {
    await supabase.from("collection_members").insert(
      allNames.map((name) => ({
        collection_id: collection.id,
        name,
        status: "pending",
      })),
    );
  }

  redirect(`/collections/${collection.id}`);
}

// Treasurer manually marks a payment as paid (cash, bank transfer, etc.)
export async function markPaid(paymentId: string, collectionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", paymentId);

  revalidatePath(`/collections/${collectionId}`);
}

// Treasurer marks a roster member as paid manually (cash / bank transfer).
// Inserts a payments row so the SECURITY DEFINER trigger flips the member
// status to 'paid' — no direct UPDATE policy needed on collection_members.
export async function markMemberPaid(
  memberId: string,
  memberName: string,
  collectionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inte inloggad." };

  // Fast-path: if already paid, there's nothing to do. The real guard against
  // the race is the partial unique index idx_one_paid_per_member (below).
  const { data: member } = await supabase
    .from("collection_members")
    .select("status")
    .eq("id", memberId)
    .single();
  if (member?.status === "paid") {
    revalidatePath(`/collections/${collectionId}`);
    return { error: "Personen har redan betalat." };
  }

  const { data: col } = await supabase
    .from("collections")
    .select("amount")
    .eq("id", collectionId)
    .single();

  if (!col) return { error: "Förfrågan hittades inte." };

  const { error } = await supabase.from("payments").insert({
    collection_id: collectionId,
    collection_member_id: memberId,
    payer_name: memberName,
    amount: col.amount,
    status: "paid",
    payment_method: "manual",
    paid_at: new Date().toISOString(),
  });

  // 23505 = unique_violation from idx_one_paid_per_member: a payment for this
  // member already exists (e.g. the payer paid concurrently). The member is
  // already paid, so surface a friendly message instead of a 500.
  if (error && error.code !== "23505")
    return { error: "Kunde inte registrera betalningen. Försök igen." };

  revalidatePath(`/collections/${collectionId}`);
  return { error: error?.code === "23505" ? "Personen har redan betalat." : null };
}

// Close or re-open a collection
export async function setCollectionStatus(
  collectionId: string,
  status: "active" | "closed",
) {
  const supabase = await createClient();
  await supabase.from("collections").update({ status }).eq("id", collectionId);
  revalidatePath(`/collections/${collectionId}`);
}
