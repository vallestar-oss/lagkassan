import Link from "next/link";
import { IconBanknotes } from "@/components/icons";
import { buttonClass } from "@/lib/ui";

// Empty state with a single call to action, shown where a list of
// collections would otherwise be (dashboard and team page).
export function EmptyCollections({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="border border-surface-border border-dashed rounded-lg bg-surface-alt/40 p-12 flex flex-col items-center text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center">
        <IconBanknotes className="w-6 h-6 text-accent" />
      </div>
      <div>
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-muted mt-1 max-w-xs">{text}</p>
      </div>
      <Link href={href} className={buttonClass("primary")}>
        {cta}
      </Link>
    </div>
  );
}
