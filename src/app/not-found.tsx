import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12 text-center gap-3">
      <span className="font-bold text-xl text-text-primary tracking-tight">Lagkassan</span>
      <p className="font-semibold text-text-primary mt-4">Sidan hittades inte</p>
      <p className="text-sm text-text-muted max-w-xs">
        Sidan finns inte, eller så har du inte behörighet att se den.
      </p>
      <Link href="/dashboard" className="text-sm font-medium text-accent hover:underline mt-2">
        ← Till din översikt
      </Link>
    </div>
  );
}
