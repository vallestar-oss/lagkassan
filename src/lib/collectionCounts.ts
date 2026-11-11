import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
type Row = { collection_id: string; status: string };

export type CollectionCounts = { paid: number; total: number };

/**
 * Paid/total per collection, as shown on collection cards. Anything not
 * 'unpaid' (reported or confirmed) counts as paid.
 */
export function tallyCollectionCounts(members: Row[]): Record<string, CollectionCounts> {
  const map: Record<string, CollectionCounts> = {};
  for (const row of members) {
    const counts = (map[row.collection_id] ??= { paid: 0, total: 0 });
    counts.total++;
    if (row.status !== "unpaid") counts.paid++;
  }
  return map;
}

export async function fetchCollectionCounts(
  supabase: Client,
  collectionIds: string[],
): Promise<Record<string, CollectionCounts>> {
  if (!collectionIds.length) return {};

  const { data: members } = await supabase
    .from("collection_members")
    .select("collection_id, status")
    .in("collection_id", collectionIds);

  return tallyCollectionCounts(members ?? []);
}
