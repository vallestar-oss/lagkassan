import Link from "next/link";
import { formatOre, formatSwedishDate } from "@/lib/utils";

export type CollectionCardData = {
  id: string;
  title: string;
  amount: number;
  deadline: string | null;
  status: string;
  paid_count: number;
  total_count: number;
  team_name?: string;
  group_label: string | null;
};

export function CollectionCard({
  collection,
  showTeamName,
}: {
  collection: CollectionCardData;
  showTeamName?: boolean;
}) {
  const pct =
    collection.total_count > 0
      ? Math.round((collection.paid_count / collection.total_count) * 100)
      : 0;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="bg-white border border-surface-border rounded-lg px-5 py-4 shadow-card hover:border-accent/40 hover:shadow-md transition-all group flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
            {collection.title}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {showTeamName && collection.team_name && (
              <span className="text-text-muted">{collection.team_name} · </span>
            )}
            {collection.group_label && (
              <span className="font-medium text-text-primary">{collection.group_label} · </span>
            )}
            {formatOre(collection.amount)}
            {collection.deadline && (
              <> · {formatSwedishDate(collection.deadline)}</>
            )}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold font-mono text-text-primary">
            {collection.paid_count}/{collection.total_count}
          </p>
          <p className="text-xs text-text-muted">{pct}% markerat</p>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
