"use client";

import { useState } from "react";

export function RemindersSection({
  shareUrl,
  unpaidCount,
  reminderText,
}: {
  shareUrl: string;
  unpaidCount: number;
  reminderText: string;
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(reminderText);
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  }

  return (
    <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col gap-3">
      <p className="text-sm font-semibold text-text-primary">Dela insamling</p>

      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm text-text-primary bg-surface border border-surface-border rounded px-3 py-2 font-mono truncate">
          {shareUrl}
        </code>
        <button
          type="button"
          onClick={copyLink}
          className={`text-sm font-medium px-3 py-2 rounded-md border transition-colors whitespace-nowrap ${
            linkCopied
              ? "bg-success-light border-success/30 text-success"
              : "border-surface-border text-text-muted hover:border-accent hover:text-accent bg-white"
          }`}
        >
          {linkCopied ? "Kopierad!" : "Kopiera länk"}
        </button>
      </div>

      <p className="text-xs text-text-muted">
        {unpaidCount === 0
          ? "Alla har markerat eller bekräftats som betalda."
          : `${unpaidCount} ${unpaidCount === 1 ? "person har" : "personer har"} inte markerat betalning ännu.`}
      </p>

      <button
        type="button"
        onClick={copyMessage}
        className={`self-start text-sm font-medium px-4 py-2 rounded-md border transition-colors ${
          messageCopied
            ? "bg-success-light border-success/30 text-success"
            : "border-surface-border text-text-muted hover:border-accent hover:text-accent bg-white"
        }`}
      >
        {messageCopied ? "Kopierad!" : "Kopiera påminnelse"}
      </button>
    </div>
  );
}
