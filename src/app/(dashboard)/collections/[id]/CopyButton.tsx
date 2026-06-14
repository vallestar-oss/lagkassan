"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={`text-sm font-medium px-3 py-2 rounded-md border transition-colors whitespace-nowrap ${
        copied
          ? "bg-success-light border-success/30 text-success"
          : "border-surface-border text-text-muted hover:border-accent hover:text-accent bg-white"
      }`}
    >
      {copied ? "Kopierad!" : "Kopiera"}
    </button>
  );
}
