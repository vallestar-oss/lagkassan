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

// Close or re-open a collection
export async function setCollectionStatus(
  collectionId: string,
  status: "active" | "closed",
) {
  const supabase = await createClient();
  await supabase.from("collections").update({ status }).eq("id", collectionId);
  revalidatePath(`/collections/${collectionId}`);
}
