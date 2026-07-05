import Link from "next/link";
import type { ReactNode } from "react";
import { SectionLabel } from "./SectionLabel";

export function PageHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  action,
}: {
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {backHref && (
          <Link href={backHref} className="text-xs text-text-muted hover:text-text-primary transition-colors">
            {backLabel ?? "← Tillbaka"}
          </Link>
        )}
        {eyebrow && <SectionLabel className="mb-1">{eyebrow}</SectionLabel>}
        <h1 className={`text-[26px] leading-tight font-bold text-text-primary ${backHref ? "mt-1.5" : ""}`}>
          {title}
        </h1>
        {subtitle && <div className="text-sm text-text-muted mt-1">{subtitle}</div>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
