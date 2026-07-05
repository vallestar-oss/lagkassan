// Tiny local design-system helpers — no external dependency (no clsx/cva).
// Centralizes the class strings that were previously duplicated ad hoc
// across every form/button/card in the app.

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "subtle" | "success";
export type ButtonSize = "sm" | "md" | "chip";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";

const buttonSizes: Record<ButtonSize, string> = {
  sm: "text-xs px-3 min-h-9",
  md: "text-sm px-4 min-h-11",
  // Compact text, full 44px tap height — inline row actions in dense lists
  // (mark paid / confirm / revert / remove).
  chip: "text-xs px-3 min-h-11",
};

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-hover",
  secondary: "bg-white text-text-primary border border-surface-border shadow-sm hover:border-accent/40 hover:text-accent",
  ghost: "text-text-muted hover:text-text-primary hover:bg-surface-alt",
  destructive: "bg-white text-text-muted border border-surface-border hover:border-danger hover:text-danger",
  subtle: "text-accent hover:bg-accent-light",
  success: "bg-white text-text-muted border border-surface-border hover:border-success hover:text-success",
};

// Usable on <button>, <Link>, or any element — pass the resulting string as className.
export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(buttonBase, buttonSizes[size], buttonVariantClasses[variant], className);
}

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-white text-text-muted border-surface-border",
  accent: "bg-accent-light text-accent border-accent/20",
  success: "bg-success-light text-success border-success/20",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-danger-light text-danger border-danger/20",
};

export function badgeClass(variant: BadgeVariant = "neutral", className?: string): string {
  return cn(
    "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap",
    badgeVariantClasses[variant],
    className,
  );
}

// Shared card surface — usable on <div>, <Link>, or anything else, not just
// the Card component (e.g. CollectionCard is a whole <Link> card).
export const cardClass = "bg-white border border-surface-border rounded-lg shadow-card";

// Shared input/textarea sizing so every form field lines up with buttons (44px).
export const inputClass =
  "w-full border border-surface-border rounded-md px-3 min-h-11 text-sm bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors";

export const textareaClass =
  "w-full border border-surface-border rounded-md px-3 py-2.5 text-sm bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-light transition-colors resize-none";
