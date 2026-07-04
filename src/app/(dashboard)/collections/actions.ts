"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
        status: "unpaid",
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

// Treasurer records a roster member as paid manually (cash / bank transfer),
// vouching for it directly — no self-report/confirm step needed. Inserts a
// payments row with payment_method:'manual' so the SECURITY DEFINER trigger
// flips the member status straight to 'confirmed_paid'.
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

  // Fast-path: only unpaid members can be marked this way. The real guard
  // against the race is the partial unique index idx_one_paid_per_member.
  const { data: member } = await supabase
    .from("collection_members")
    .select("status")
    .eq("id", memberId)
    .single();
  if (member && member.status !== "unpaid") {
    revalidatePath(`/collections/${collectionId}`);
    return { error: "Personen är redan rapporterad eller bekräftad som betald." };
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

// Treasurer confirms a member's self-reported payment after checking it
// externally (e.g. against the Swish/bank statement). Only moves
// reported_paid -> confirmed_paid; never touches an already-unpaid member.
export async function confirmMemberPayment(
  memberId: string,
  collectionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const { data: member } = await supabase
    .from("collection_members")
    .select("status")
    .eq("id", memberId)
    .eq("collection_id", collectionId)
    .single();
  if (!member) return { error: "Deltagaren hittades inte." };
  if (member.status !== "reported_paid")
    return { error: "Endast rapporterade betalningar kan bekräftas." };

  const { error } = await supabase
    .from("collection_members")
    .update({ status: "confirmed_paid" })
    .eq("id", memberId)
    .eq("collection_id", collectionId);

  if (error) return { error: "Kunde inte bekräfta betalningen. Försök igen." };

  revalidatePath(`/collections/${collectionId}`);
  return { error: null };
}

// Treasurer reverts a member's payment status one step back:
//   confirmed_paid → reported_paid  (leaves payment row intact; member stays reported)
//   reported_paid  → unpaid         (deletes the payment row so member can re-report)
export async function revertMemberPayment(
  memberId: string,
  collectionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const { data: member } = await supabase
    .from("collection_members")
    .select("status")
    .eq("id", memberId)
    .eq("collection_id", collectionId)
    .single();
  if (!member) return { error: "Deltagaren hittades inte." };
  if (member.status === "unpaid")
    return { error: "Personen är redan markerad som obetald." };

  if (member.status === "confirmed_paid") {
    // Step back to reported — the self-report payment row is still valid.
    const { error } = await supabase
      .from("collection_members")
      .update({ status: "reported_paid" })
      .eq("id", memberId)
      .eq("collection_id", collectionId);
    if (error) return { error: "Kunde inte återställa statusen. Försök igen." };
  } else {
    // reported_paid → unpaid: also delete the payment row so the member can
    // self-report again. No treasurer DELETE policy exists on payments, so we
    // use the admin (service-role) client which bypasses RLS.
    const { error: memberError } = await supabase
      .from("collection_members")
      .update({ status: "unpaid" })
      .eq("id", memberId)
      .eq("collection_id", collectionId);
    if (memberError) return { error: "Kunde inte återställa statusen. Försök igen." };

    const admin = createAdminClient();
    await admin
      .from("payments")
      .delete()
      .eq("collection_member_id", memberId)
      .eq("collection_id", collectionId);
    // Ignore payment-delete errors — member status is already reset, and a
    // lingering payment row is harmless once the member is unpaid (the unique
    // index only blocks inserts, not reads).
  }

  revalidatePath(`/collections/${collectionId}`);
  return { error: null };
}

// Add one or more participants to an existing active collection.
// Names are submitted as a newline-separated textarea value.
export async function addCollectionMembers(
  collectionId: string,
  _prev: { error: string | null; added: number; skipped: string[] },
  formData: FormData,
): Promise<{ error: string | null; added: number; skipped: string[] }> {
  const supabase = await createClient();

  const { error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError, added: 0, skipped: [] };

  // Belt-and-suspenders: reject if collection is not active regardless of UI state.
  const { data: col } = await supabase
    .from("collections")
    .select("status")
    .eq("id", collectionId)
    .single();
  if (!col) return { error: "Förfrågan hittades inte.", added: 0, skipped: [] };
  if (col.status !== "active")
    return { error: "Det går bara att lägga till deltagare i aktiva förfrågningar.", added: 0, skipped: [] };

  const raw = (formData.get("names") as string | null) ?? "";
  const names = raw
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => n.slice(0, 100)); // cap individual name length

  if (names.length === 0)
    return { error: "Ange minst ett namn.", added: 0, skipped: [] };
  if (names.length > 200)
    return { error: "Max 200 namn per gång.", added: 0, skipped: [] };

  // Fetch existing names for this collection to deduplicate.
  const { data: existing } = await supabase
    .from("collection_members")
    .select("name")
    .eq("collection_id", collectionId);

  const existingLower = new Set(
    (existing ?? []).map((m) => m.name.trim().toLowerCase()),
  );

  const toInsert: string[] = [];
  const skipped: string[] = [];
  for (const name of names) {
    if (existingLower.has(name.toLowerCase())) {
      skipped.push(name);
    } else {
      toInsert.push(name);
      existingLower.add(name.toLowerCase()); // prevent duplicates within the same submission
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("collection_members").insert(
      toInsert.map((name) => ({
        collection_id: collectionId,
        name,
        status: "unpaid",
      })),
    );
    if (error) return { error: "Kunde inte lägga till deltagare. Försök igen.", added: 0, skipped: [] };
  }

  revalidatePath(`/collections/${collectionId}`);
  return { error: null, added: toInsert.length, skipped };
}

// Remove an unpaid roster participant from an active collection.
export async function removeCollectionMember(
  memberId: string,
  collectionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const { data: col } = await supabase
    .from("collections")
    .select("status")
    .eq("id", collectionId)
    .single();
  if (!col) return { error: "Förfrågan hittades inte." };
  if (col.status !== "active")
    return { error: "Det går bara att ta bort deltagare från aktiva förfrågningar." };

  // Verify the member belongs to this collection and is still unpaid — a
  // reported or confirmed payment must not be silently deleted.
  const { data: member } = await supabase
    .from("collection_members")
    .select("status")
    .eq("id", memberId)
    .eq("collection_id", collectionId)
    .single();
  if (!member) return { error: "Deltagaren hittades inte." };
  if (member.status !== "unpaid")
    return { error: "Det går inte att ta bort en deltagare som har rapporterat eller fått bekräftad betalning." };

  const { error } = await supabase
    .from("collection_members")
    .delete()
    .eq("id", memberId)
    .eq("collection_id", collectionId);

  if (error) return { error: "Kunde inte ta bort deltagaren. Försök igen." };

  revalidatePath(`/collections/${collectionId}`);
  return { error: null };
}

// Update the payment instructions text on a collection.
export async function updatePaymentInstructions(
  collectionId: string,
  _prev: { error: string | null; saved: boolean },
  formData: FormData,
): Promise<{ error: string | null; saved: boolean }> {
  const supabase = await createClient();

  const { error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError, saved: false };

  const instructions = (formData.get("payment_instructions") as string | null)?.trim() ?? "";

  const { data: col } = await supabase
    .from("collections")
    .select("status")
    .eq("id", collectionId)
    .single();
  if (!col) return { error: "Förfrågan hittades inte.", saved: false };
  if (col.status !== "active")
    return { error: "Det går bara att redigera instruktioner för aktiva förfrågningar.", saved: false };

  const { error } = await supabase
    .from("collections")
    .update({ payment_instructions: instructions || null })
    .eq("id", collectionId);

  if (error) return { error: "Kunde inte spara instruktionerna. Försök igen.", saved: false };

  revalidatePath(`/collections/${collectionId}`);
  return { error: null, saved: true };
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
