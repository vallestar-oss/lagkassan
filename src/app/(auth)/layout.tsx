import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="font-bold text-xl text-text-primary mb-8 tracking-tight hover:text-accent transition-colors"
      >
        Lagkassan
      </Link>
      <div className="w-full max-w-sm bg-white border border-surface-border rounded-lg shadow-card p-8">
        {children}
      </div>
    </div>
  );
}
