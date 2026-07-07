"use client";

import { useState, useTransition } from "react";

export function CloseCollectionButton({
  collectionId,
  isActive,
  collectionTitle,
  action,
}: {
  collectionId: string;
  isActive: boolean;
  collectionTitle: string;
  action: (collectionId: string, status: "active" | "closed") => Promise<{ error: string | null }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (isActive) {
      const ok = window.confirm(
        `Stänga förfrågan "${collectionTitle}"? Länken slutar fungera för medlemmarna tills du öppnar den igen.`,
      );
      if (!ok) return;
    }
    setError(null);
    startTransition(async () => {
      const res = await action(collectionId, isActive ? "closed" : "active");
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`text-xs font-medium px-3 min-h-11 inline-flex items-center justify-center rounded-md border shadow-sm transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
          isActive
            ? "bg-white border-surface-border text-text-muted hover:border-danger hover:text-danger"
            : "border-success/30 text-success bg-success-light hover:bg-success-light"
        }`}
      >
        {isPending ? "…" : isActive ? "Stäng förfrågan" : "Öppna igen"}
      </button>
      {error && <p className="text-xs text-danger text-right max-w-[220px]">{error}</p>}
    </div>
  );
}
