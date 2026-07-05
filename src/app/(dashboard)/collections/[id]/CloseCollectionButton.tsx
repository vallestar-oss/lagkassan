"use client";

import { useTransition } from "react";

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

  function handleClick() {
    if (isActive) {
      const ok = window.confirm(
        `Stänga förfrågan "${collectionTitle}"? Länken slutar fungera för medlemmarna tills du öppnar den igen.`,
      );
      if (!ok) return;
    }
    startTransition(async () => {
      await action(collectionId, isActive ? "closed" : "active");
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs font-medium px-3 min-h-11 inline-flex items-center justify-center rounded border transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
        isActive
          ? "border-surface-border text-text-muted hover:border-danger hover:text-danger"
          : "border-success/30 text-success bg-success-light hover:bg-success-light"
      }`}
    >
      {isPending ? "…" : isActive ? "Stäng förfrågan" : "Öppna igen"}
    </button>
  );
}
