"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTeamRole, assertCollectionRole } from "@/lib/auth";
import { parseSekToOre } from "@/lib/utils";
import { normalizeNames, parseNameList, splitNewNames } from "@/lib/names";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type CollectionState = { error: string | null };

const MAX_TITLE_LENGTH = 120;
const MAX_TEXT_LENGTH = 2000;
const MAX_AMOUNT_ORE = 1_000_000 * 100; // 1 000 000 kr per person
const MAX_MEMBERS_PER_COLLECTION = 200; // same cap as addCollectionMembers

// Revalidate every view that shows this collection's summary/status so the
// dashboard, team page, and collection detail page never show stale counts.
function revalidateCollectionViews(collectionId: string, teamId?: string) {
  revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/dashboard");
  if (teamId) revalidatePath(`/teams/${teamId}`);
}

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
  if (title.length > MAX_TITLE_LENGTH)
    return { error: `Rubriken får vara högst ${MAX_TITLE_LENGTH} tecken.` };
  if (description.length > MAX_TEXT_LENGTH || paymentInstructions.length > MAX_TEXT_LENGTH)
    return { error: `Beskrivning och instruktioner får vara högst ${MAX_TEXT_LENGTH} tecken.` };
  if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
    return { error: "Ogiltigt datum för sista betaldag." };
  if (!amountStr || isNaN(parseFloat(amountStr.replace(",", "."))))
    return { error: "Ange ett giltigt belopp." };

  const amount = parseSekToOre(amountStr);
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "Beloppet måste vara större än 0 kr." };
  if (amount > MAX_AMOUNT_ORE)
    return { error: "Beloppet är för högt. Max 1 000 000 kr per person." };

  // Roster names + any extra names, cleaned the same way as addCollectionMembers
  // (trimmed, length-capped, de-duplicated, max count).
  const { names: allNames, tooMany } = normalizeNames(
    [
      ...(formData.getAll("member_name") as string[]),
      ...(formData.getAll("extra_name") as string[]),
    ],
    MAX_MEMBERS_PER_COLLECTION,
  );
  // Every collection has a participant list — that list is what the public
  // page shows and what the treasurer confirms payments against.
  if (allNames.length === 0)
    return { error: "Välj minst en person som ska betala." };
  if (tooMany)
    return { error: `Max ${MAX_MEMBERS_PER_COLLECTION} deltagare per förfrågan.` };

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

  if (error || !collection) return { error: "Kunde inte skapa förfrågan. Försök igen." };

  const { error: membersError } = await supabase.from("collection_members").insert(
    allNames.map((name) => ({
      collection_id: collection.id,
      name,
      status: "unpaid",
    })),
  );
  if (membersError) {
    // Don't leave a collection without participants behind. No RLS delete
    // policy exists on collections, so remove it with the service role — safe
    // here because we just created this exact row as the verified caller.
    await createAdminClient().from("collections").delete().eq("id", collection.id);
    return { error: "Kunde inte lägga till deltagarna. Försök igen." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/teams/${teamId}`);
  redirect(`/collections/${collection.id}`);
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
  const { user, teamId, error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  // Fast-path: only unpaid members can be marked this way. The real guard
  // against the race is the partial unique index idx_one_paid_per_member.
  // The member MUST belong to this collection: the payments trigger updates
  // collection_members by id alone, so an unscoped lookup would let a
  // treasurer flip a member of someone else's collection.
  const { data: member } = await supabase
    .from("collection_members")
    .select("status")
    .eq("id", memberId)
    .eq("collection_id", collectionId)
    .single();
  if (!member) return { error: "Deltagaren hittades inte." };
  if (member.status !== "unpaid") {
    revalidateCollectionViews(collectionId, teamId);
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
  if (error?.code === "23505") {
    revalidateCollectionViews(collectionId, teamId);
    return { error: "Personen har redan betalat." };
  }

  // Trigger (SECURITY DEFINER) already set confirmed_at. Set confirmed_by here
  // since auth.uid() is unreliable inside a SECURITY DEFINER function.
  if (user) {
    await supabase
      .from("collection_members")
      .update({ confirmed_by: user.id })
      .eq("id", memberId)
      .eq("collection_id", collectionId);
  }

  revalidateCollectionViews(collectionId, teamId);
  return { error: null };
}

// Treasurer confirms a member's self-reported payment after checking it
// externally (e.g. against the Swish/bank statement). Only moves
// reported_paid -> confirmed_paid; never touches an already-unpaid member.
export async function confirmMemberPayment(
  memberId: string,
  collectionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { user, teamId, error: authError } = await assertCollectionRole(supabase, collectionId, [
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
    .update({
      status: "confirmed_paid",
      confirmed_at: new Date().toISOString(),
      confirmed_by: user?.id ?? null,
    })
    .eq("id", memberId)
    .eq("collection_id", collectionId);

  if (error) return { error: "Kunde inte bekräfta betalningen. Försök igen." };

  revalidateCollectionViews(collectionId, teamId);
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

  const { teamId, error: authError } = await assertCollectionRole(supabase, collectionId, [
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
    // Step back to reported — clear confirm timestamps, keep reported_at.
    const { error } = await supabase
      .from("collection_members")
      .update({ status: "reported_paid", confirmed_at: null, confirmed_by: null })
      .eq("id", memberId)
      .eq("collection_id", collectionId);
    if (error) return { error: "Kunde inte återställa statusen. Försök igen." };
  } else {
    // reported_paid → unpaid: delete the payment row so the member can
    // self-report again, then clear the status. No treasurer DELETE policy
    // exists on payments, so we use the admin (service-role) client which
    // bypasses RLS.
    //
    // Order matters: the payment goes FIRST and its error is checked. A
    // lingering paid row is NOT harmless — the partial unique index
    // idx_one_paid_per_member would reject the member's next report with
    // "already paid" while the status says unpaid. If the status update fails
    // after the delete, the member is merely still 'reported_paid' with no
    // payment row, and the treasurer can simply retry the revert.
    const { error: paymentError } = await createAdminClient()
      .from("payments")
      .delete()
      .eq("collection_member_id", memberId)
      .eq("collection_id", collectionId);
    if (paymentError) return { error: "Kunde inte återställa statusen. Försök igen." };

    const { error: memberError } = await supabase
      .from("collection_members")
      .update({ status: "unpaid", reported_at: null, confirmed_at: null, confirmed_by: null })
      .eq("id", memberId)
      .eq("collection_id", collectionId);
    if (memberError) return { error: "Kunde inte återställa statusen. Försök igen." };
  }

  revalidateCollectionViews(collectionId, teamId);
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

  const { teamId, error: authError } = await assertCollectionRole(supabase, collectionId, [
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

  const names = parseNameList((formData.get("names") as string | null) ?? "");

  if (names.length === 0)
    return { error: "Ange minst ett namn.", added: 0, skipped: [] };
  if (names.length > MAX_MEMBERS_PER_COLLECTION)
    return { error: `Max ${MAX_MEMBERS_PER_COLLECTION} namn per gång.`, added: 0, skipped: [] };

  const { data: existing } = await supabase
    .from("collection_members")
    .select("name")
    .eq("collection_id", collectionId);

  const { toInsert, skipped } = splitNewNames(names, (existing ?? []).map((m) => m.name));

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

  revalidateCollectionViews(collectionId, teamId);
  return { error: null, added: toInsert.length, skipped };
}

// Remove an unpaid roster participant from an active collection.
export async function removeCollectionMember(
  memberId: string,
  collectionId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { teamId, error: authError } = await assertCollectionRole(supabase, collectionId, [
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

  // A collection must always keep at least one participant.
  const { count } = await supabase
    .from("collection_members")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", collectionId);
  if ((count ?? 0) <= 1)
    return { error: "En förfrågan måste ha minst en deltagare. Stäng förfrågan i stället." };

  const { error } = await supabase
    .from("collection_members")
    .delete()
    .eq("id", memberId)
    .eq("collection_id", collectionId);

  if (error) return { error: "Kunde inte ta bort deltagaren. Försök igen." };

  revalidateCollectionViews(collectionId, teamId);
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
  const { teamId, error: authError } = await assertCollectionRole(supabase, collectionId, [
    "owner",
    "treasurer",
  ]);
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("collections")
    .update({ status })
    .eq("id", collectionId);

  if (error) return { error: "Kunde inte uppdatera förfrågan. Försök igen." };

  revalidateCollectionViews(collectionId, teamId);
  return { error: null };
}
