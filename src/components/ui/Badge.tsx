import { badgeClass, type BadgeVariant } from "@/lib/ui";

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={badgeClass(variant, className)} {...props} />;
}
