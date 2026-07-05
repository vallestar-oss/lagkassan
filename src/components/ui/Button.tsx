import { buttonClass, type ButtonVariant, type ButtonSize } from "@/lib/ui";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

// Plain presentational button — no client hooks, so it works inside
// Server Action forms (`<form action={...}><Button type="submit" /></form>`)
// as well as Client Components.
export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
