"use client";

import { useState } from "react";

export function ShareSection({
  shareUrl,
  qrDataUrl,
  unpaidCount,
  reminderText,
  canManage,
}: {
  shareUrl: string;
  qrDataUrl: string;
  unpaidCount: number;
  reminderText: string;
  canManage: boolean;
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
    <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col gap-4">
      <p className="text-sm font-semibold text-text-primary">Dela betalningslänk</p>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
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
              {linkCopied ? "Länk kopierad" : "Kopiera länk"}
            </button>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Dela länken i lagets gruppchatt. Alla använder samma länk och väljer sitt eget namn.
          </p>

          {canManage && (
            <>
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
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- small server-generated data URL, not an optimizable remote image */}
          <img
            src={qrDataUrl}
            alt="QR-kod till betalningslänken"
            width={120}
            height={120}
            className="border border-surface-border rounded-md"
          />
          <p className="text-xs text-text-muted">Skanna för att öppna länken</p>
        </div>
      </div>
    </div>
  );
}
