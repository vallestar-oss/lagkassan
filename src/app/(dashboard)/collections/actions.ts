"use server";

import { createClient } from "@/lib/supabase/server";
import { assertTeamRole, assertCollectionRole } from "@/lib/auth";
import { parseSekToOre } from "@/lib/utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type CollectionState = { error: string | null };

export async function createCollection(
  _prev: CollectionState,
  formData: FormData,
): Promise<CollectionState> {
  const supabase = await createClient();

  const teamId = (formData.get("team_id") as string | null) ?? "";

  // Defense-in-depth: only owners/treasurers of this team may create collections.
  const { user, error: authError } = await assertTeamRole(supabase, teamId, [
    "owner",
    "treasurer",
  ]);
  if (authError || !user) return { error: authError };

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const paymentInstructions = (formData.get("payment_instructions") as string | null)?.trim() ?? "";
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
      payment_instructions: paymentInstructions || null,
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
export async function markPaid(
  paymentId: string,
  collectionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Defense-in-depth: the payments RLS is permissive (public insert), so verify
  // the caller is an owner/treasurer of this collection's team before writing.
  const { error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (error) return { error: "Kunde inte uppdatera betalningen. Försök igen." };

  revalidatePath(`/collections/${collectionId}`);
  return { error: null };
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

  // Defense-in-depth: the payments RLS allows public inserts, so verify the
  // caller is an owner/treasurer of this collection's team before inserting a
  // manual 'paid' payment on a member's behalf.
  const { error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

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
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Defense-in-depth: only owners/treasurers of this collection's team.
  const { error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("collections")
    .update({ status })
    .eq("id", collectionId);

  if (error) return { error: "Kunde inte uppdatera förfrågan. Försök igen." };

  revalidatePath(`/collections/${collectionId}`);
  return { error: null };
}
