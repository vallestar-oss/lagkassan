import Link from "next/link";

// ─── Icons (inline SVG, Heroicons outline style) ────────────────────────────
function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}


function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

// ─── Pricing card ────────────────────────────────────────────────────────────
function PricingCard({
  name,
  price,
  period,
  badge,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg p-8 shadow-card flex flex-col gap-6 ${
        highlighted
          ? "bg-accent text-white"
          : "bg-white border border-surface-border"
      }`}
    >
      {badge && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full ${
            highlighted ? "bg-white text-accent" : "bg-accent text-white"
          }`}
        >
          {badge}
        </span>
      )}
      <div>
        <p className={`text-sm font-medium uppercase tracking-wider mb-2 ${highlighted ? "text-white/70" : "text-text-muted"}`}>
          {name}
        </p>
        <div className="flex items-end gap-1">
          <span className={`font-mono text-4xl font-bold ${highlighted ? "text-white" : "text-text-primary"}`}>
            {price}
          </span>
          <span className={`text-sm mb-1 ${highlighted ? "text-white/70" : "text-text-muted"}`}>
            {period}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <IconCheck
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlighted ? "text-white" : "text-success"}`}
            />
            <span className={highlighted ? "text-white/90" : "text-text-primary"}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className={`mt-auto text-center text-sm font-semibold px-5 py-3 rounded-md transition-colors ${
          highlighted
            ? "bg-white text-accent hover:bg-accent-light"
            : "bg-accent text-white hover:bg-accent-hover"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

// ─── FAQ item ────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-surface-border py-6">
      <p className="font-semibold text-text-primary mb-2">{q}</p>
      <p className="text-text-muted text-sm leading-relaxed">{a}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-surface-border bg-surface sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-text-primary tracking-tight">Lagkassan</span>
          <nav className="flex items-center gap-6">
            <a href="#hur-det-fungerar" className="text-sm text-text-muted hover:text-text-primary transition-colors hidden sm:block">
              Hur det fungerar
            </a>
            <a href="#priser" className="text-sm text-text-muted hover:text-text-primary transition-colors hidden sm:block">
              Priser
            </a>
            <Link
              href="/login"
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Logga in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors"
            >
              Kom igång
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-light text-accent text-xs font-semibold px-3 py-1 rounded-full mb-8">
            <IconBolt className="w-3 h-3" />
            Swish-stöd kommer snart
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-6 max-w-2xl mx-auto">
            Samla in föreningsavgifter — utan krångel
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-xl mx-auto mb-10">
            Skapa en betalningslänk på 30 sekunder. Dela den med medlemmarna.
            Se i realtid vem som betalt — utan att de behöver ett konto.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-accent text-white font-semibold px-6 py-3 rounded-md hover:bg-accent-hover transition-colors"
            >
              Testa gratis
            </Link>
            <a
              href="#hur-det-fungerar"
              className="text-text-muted border border-surface-border bg-white font-medium px-6 py-3 rounded-md hover:border-text-muted transition-colors"
            >
              Se hur det fungerar
            </a>
          </div>

          {/* Mock UI preview */}
          <div className="mt-16 max-w-lg mx-auto bg-white rounded-lg border border-surface-border shadow-card overflow-hidden text-left">
            <div className="bg-surface-alt border-b border-surface-border px-5 py-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-danger/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              <span className="ml-2 text-xs text-text-muted">Höstterminsavgift 2024 — 300 kr</span>
            </div>
            <div className="divide-y divide-surface-border">
              {[
                { name: "Anna Lindqvist", status: "paid" },
                { name: "Erik Johansson", status: "paid" },
                { name: "Maria Svensson", status: "pending" },
                { name: "Lars Pettersson", status: "pending" },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-text-primary">{p.name}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      p.status === "paid"
                        ? "bg-success-light text-success"
                        : "bg-surface-alt text-text-muted"
                    }`}
                  >
                    {p.status === "paid" ? "Betald" : "Ej betald"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section id="hur-det-fungerar" className="bg-surface-alt border-y border-surface-border py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
              Tre steg, sedan är du klar
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                {
                  icon: <IconBolt className="w-5 h-5" />,
                  step: "1",
                  title: "Skapa en betalningsförfrågan",
                  body: "Ange rubrik, belopp och sista betalningsdag. Tar under en minut.",
                },
                {
                  icon: <IconLink className="w-5 h-5" />,
                  step: "2",
                  title: "Dela länken",
                  body: "Skicka till WhatsApp-gruppen, mejlet eller Facebook. Mottagarna behöver inget konto.",
                },
                {
                  icon: <IconEye className="w-5 h-5" />,
                  step: "3",
                  title: "Se vem som betalt",
                  body: "Listan uppdateras direkt när betalningen kommer in. Inga manuella bockar.",
                },
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-lg border border-surface-border p-6 shadow-card">
                  <div className="w-9 h-9 rounded-md bg-accent-light text-accent flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Steg {item.step}
                  </p>
                  <h3 className="font-semibold text-text-primary mb-2">{item.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Who it's for ──────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-text-primary mb-4">
              Byggt för kassören i idrottsföreningen
            </h2>
            <p className="text-text-muted leading-relaxed mb-8">
              Du hanterar avgifter för 20–200 medlemmar, 2–6 gånger per år.
              Idag samlar du in via Swish till ditt privata nummer, påminner folk individuellt
              och håller koll i ett Excel-ark. Det tar timmar varje säsong.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Ingen mer manuell bockning — betalningar registreras automatiskt",
                "Inga mer individuella påminnelser — skicka en länk till hela gruppen",
                "Ingen mer osäkerhet — realtidslistan visar exakt vad som är betalt",
                "Inget krångel med enskild firma eller Swish Handel ännu — betala med kort",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-text-primary">
                  <IconCheck className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────────── */}
        <section id="priser" className="bg-surface-alt border-y border-surface-border py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-3">
                199 kr/månaden, inga dolda avgifter
              </h2>
              <p className="text-text-muted">
                Avsluta när du vill. Välj årsplan och spara 37 %.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <PricingCard
                name="Månadsplan"
                price="199 kr"
                period="/ månaden"
                features={[
                  "Obegränsat antal betalningsförfrågningar",
                  "Realtidslista med betald/ej betald",
                  "Delningslänk utan inloggning för betalar",
                  "Påminnelse-mejl till ej betalda",
                  "Avsluta när du vill",
                ]}
                cta="Kom igång"
              />
              <PricingCard
                name="Årsplan"
                price="1 490 kr"
                period="/ år"
                badge="Bäst värde"
                features={[
                  "Allt i månadsplanen",
                  "Sparar 908 kr jämfört med månad",
                  "Prioriterad support",
                  "Swish-integration ingår när den lanseras",
                  "Faktura tillgänglig",
                ]}
                cta="Välj årsplan"
                highlighted
              />
            </div>
            <p className="text-center text-xs text-text-muted mt-6">
              Priser exklusive moms. Alla priser i svenska kronor.
            </p>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-text-primary mb-2">Vanliga frågor</h2>
          <p className="text-text-muted mb-10">Hittar du inte svaret? Skriv till oss.</p>
          <div className="max-w-2xl">
            <FaqItem
              q="Behöver mina medlemmar registrera ett konto?"
              a="Nej. De klickar på länken, fyller i namn och e-post och betalar direkt. Inget konto, ingen nedladdning, ingen app."
            />
            <FaqItem
              q="Vilka betalmetoder stöds?"
              a="Just nu betalkortsbetalning via Stripe. Swish-stöd är under utveckling och kommer att rullas ut till befintliga prenumeranter utan extra kostnad."
            />
            <FaqItem
              q="Kan jag ha flera föreningar under samma konto?"
              a="Ja. Du kan skapa flera team och hantera dem separat, med egna betalningsförfrågningar och betallistor för var och en."
            />
            <FaqItem
              q="Vad händer med pengarna — går de till er?"
              a="Nej. Betalningarna går direkt till ditt Stripe-konto (och senare till ditt Swish-nummer). Vi hanterar aldrig dina pengar."
            />
            <FaqItem
              q="Vad kostar det per transaktion?"
              a="Ingenting från oss. Stripe tar en liten avgift per transaktion (ca 1,4 % + 1,80 kr för EU-kort) — det är Stripes standardavgift, inte vår."
            />
            <FaqItem
              q="Kan jag avsluta mitt konto när som helst?"
              a="Ja, du kan avsluta direkt i kontoinställningarna. Ingen bindningstid på månadsplanen. Årsplanen löper ut efter 12 månader och förnyas inte automatiskt om du inte vill."
            />
            <FaqItem
              q="Är Lagkassan på svenska?"
              a="Ja. Hela produkten — inloggning, dashboard, betalningssidor och e-post — är på svenska. Lagkassan är byggt specifikt för svenska föreningar."
            />
          </div>
        </section>

        {/* ── CTA banner ────────────────────────────────────────────────────── */}
        <section className="bg-accent py-16">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Redo att sluta jaga betalningar manuellt?
            </h2>
            <p className="text-white/80 mb-8">
              Kom igång på 5 minuter. Ingen kreditkortsuppgift krävs för att testa.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-white text-accent font-semibold px-6 py-3 rounded-md hover:bg-accent-light transition-colors"
            >
              Skapa konto gratis
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border bg-surface py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-text-muted">
          <span className="font-semibold text-text-primary">Lagkassan</span>
          <p>© {new Date().getFullYear()} Lagkassan. Enkel avgiftshantering för svenska föreningar.</p>
          <div className="flex gap-4">
            <Link href="/integritetspolicy" className="hover:text-text-primary transition-colors">Integritet</Link>
            <Link href="/villkor" className="hover:text-text-primary transition-colors">Villkor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
