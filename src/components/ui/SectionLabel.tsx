import { cn } from "@/lib/ui";

// The small uppercase muted label used above every section/card title
// ("MEDLEMMAR", "DELA", "FÖRFRÅGNINGAR", stat card labels, ...).
export function SectionLabel({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-[11px] font-semibold text-text-muted uppercase tracking-wider", className)}
      {...props}
    />
  );
}
