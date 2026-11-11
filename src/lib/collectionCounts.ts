import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
type Row = { collection_id: string; status: string };

export type CollectionCounts = { paid: number; total: number };

/**
 * Paid/total per collection, as shown on collection cards. A collection with
 * a roster counts its members (anything not 'unpaid' counts as paid); a
 * free-form collection without members falls back to its payment rows.
 */
export function tallyCollectionCounts(
  payments: Row[],
  members: Row[],
): Record<string, CollectionCounts> {
  const tally = (rows: Row[], isPaid: (status: string) => boolean) => {
    const map: Record<string, CollectionCounts> = {};
    for (const row of rows) {
      const counts = (map[row.collection_id] ??= { paid: 0, total: 0 });
      counts.total++;
      if (isPaid(row.status)) counts.paid++;
    }
    return map;
  };

  return {
    ...tally(payments, (s) => s === "paid"),
    ...tally(members, (s) => s !== "unpaid"),
  };
}

export async function fetchCollectionCounts(
  supabase: Client,
  collectionIds: string[],
): Promise<Record<string, CollectionCounts>> {
  if (!collectionIds.length) return {};

  const [{ data: payments }, { data: members }] = await Promise.all([
    supabase.from("payments").select("collection_id, status").in("collection_id", collectionIds),
    supabase.from("collection_members").select("collection_id, status").in("collection_id", collectionIds),
  ]);

  return tallyCollectionCounts(payments ?? [], members ?? []);
}
