import type { ReactNode } from "react";

// Consistent label + input + helper-text stack used across every form.
export function Field({
  label,
  optional,
  helperText,
  children,
}: {
  label: string;
  optional?: boolean;
  helperText?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-primary">
        {label}
        {optional && <span className="text-text-muted font-normal"> (valfritt)</span>}
      </span>
      {children}
      {helperText && <span className="text-xs text-text-muted">{helperText}</span>}
    </label>
  );
}
