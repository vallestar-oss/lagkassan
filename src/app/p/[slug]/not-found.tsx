export default function PaymentLinkNotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="border-b border-surface-border bg-white">
        <div className="max-w-lg mx-auto px-6 h-14 flex items-center">
          <span className="font-bold text-text-primary tracking-tight">Lagkassan</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-16 flex flex-col items-center text-center gap-3">
        <p className="font-semibold text-text-primary">Länken hittades inte</p>
        <p className="text-sm text-text-muted leading-relaxed max-w-xs">
          Den här betalningslänken finns inte, eller så har förfrågan stängts av kassören.
          Kontakta kassören om du är osäker.
        </p>
      </main>
    </div>
  );
}
