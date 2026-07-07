"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Stäng meny" : "Öppna meny"}
        aria-expanded={open}
        className="p-2 -mr-2 text-text-muted hover:text-text-primary transition-colors"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-surface border-b border-surface-border shadow-md">
          <nav className="flex flex-col px-6 py-4">
            <a
              href="#hur-det-fungerar"
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-text-primary border-b border-surface-border"
            >
              Hur det fungerar
            </a>
            <a
              href="#funktioner"
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-text-primary border-b border-surface-border"
            >
              Funktioner
            </a>
            <Link
              href="/guide"
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-text-primary border-b border-surface-border"
            >
              Så testar du
            </Link>
            <Link href="/login" onClick={() => setOpen(false)} className="py-2.5 text-sm text-text-primary">
              Logga in
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
