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

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
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
            <a href="#funktioner" className="text-sm text-text-muted hover:text-text-primary transition-colors hidden sm:block">
              Funktioner
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
              Skapa konto
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-8">
            <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Pilotfas — öppen för föreningar och kassörer
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-6 max-w-2xl mx-auto">
            Samla in föreningsavgifter — utan krångel
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-xl mx-auto mb-10">
            Skapa en betalningsförfrågan, dela en länk och låt medlemmar markera sin betalning.
            Se vem som betalat — utan att de behöver ett konto.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-accent text-white font-semibold px-6 py-3 rounded-md hover:bg-accent-hover transition-colors"
            >
              Skapa konto
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
              <span className="ml-2 text-xs text-text-muted">Höstterminsavgift — 300 kr</span>
              <span className="ml-auto text-xs text-amber-600 font-medium">Demo</span>
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
                  body: "Ange rubrik, belopp och sista betalningsdag. Lägg till en namnlista så vet systemet vem som ska betala.",
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
                  title: "Se vem som betalat",
                  body: "Listan uppdateras när en medlem markerar sin betalning. Du ser direkt vad som återstår.",
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

        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section id="funktioner" className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-3">
              Byggt för lagledare och kassörer
            </h2>
            <p className="text-text-muted max-w-xl mx-auto">
              Allt du behöver för att samla in avgifter från en grupp — utan kalkylark och individuella påminnelser.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: <IconLink className="w-5 h-5" />,
                title: "En gemensam betalningslänk",
                body: "Varje förfrågan får en unik delningslänk. Skicka den en gång till hela gruppen — inga individuella inbjudningar.",
              },
              {
                icon: <IconUsers className="w-5 h-5" />,
                title: "Medlemmar väljer sitt namn",
                body: "Öppna länken, hitta ditt namn i listan och markera din betalning. Inget konto eller app krävs.",
              },
              {
                icon: <IconEye className="w-5 h-5" />,
                title: "Översikt för kassören",
                body: "Dashboarden visar betald och obetald status per person, per förfrågan. Enkel att ta fram inför ett möte.",
              },
              {
                icon: <IconBolt className="w-5 h-5" />,
                title: "Swish eller bank — du bestämmer",
                body: "Lagkassan hanterar inte själva betalningen ännu. Du anger betalningsinstruktioner (t.ex. Swish-nummer), medlemmen betalar externt och markerar sedan att den är gjord. Kassören kontrollerar mot kontoutdraget.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-lg border border-surface-border p-6 shadow-card flex gap-4">
                <div className="w-9 h-9 rounded-md bg-accent-light text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">{f.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Who it's for ──────────────────────────────────────────────────── */}
        <section className="bg-surface-alt border-y border-surface-border py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                Igenkänning för dig som är kassör
              </h2>
              <p className="text-text-muted leading-relaxed mb-8">
                Du hanterar avgifter för 20–200 medlemmar, ett par gånger per år.
                Idag påminner du folk individuellt och håller koll i ett kalkylark.
                Det tar timmar varje säsong.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Ingen mer manuell bockning — status uppdateras när en medlem markerar sig som betald",
                  "Inga mer individuella påminnelser — skicka en länk till hela gruppen",
                  "Ingen mer osäkerhet — en samlad vy visar exakt vem som betalat",
                  "Ingen mer koll i flera kanaler — allt samlas på ett ställe",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-text-primary">
                    <IconCheck className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Pilot CTA ─────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto bg-white border border-surface-border rounded-lg p-8 shadow-card">
            <div className="inline-flex items-center gap-2 bg-accent-light text-accent text-xs font-semibold px-3 py-1 rounded-full mb-6">
              Pilotfas
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Vill du testa Lagkassan med ditt lag?
            </h2>
            <p className="text-text-muted text-sm leading-relaxed mb-6">
              Lagkassan är i aktiv pilotfas och söker föreningar, lag och kassörer som vill prova. Skapa ett konto, lägg upp en riktig betalningsförfrågan och dela länken med dina medlemmar — redan idag.
            </p>
            <div className="bg-surface rounded-lg border border-surface-border p-4 mb-6">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Hur betalningar fungerar i piloten</p>
              <ul className="flex flex-col gap-2">
                {[
                  "Du anger betalningsinstruktioner — t.ex. Swish-nummer eller bankgiro",
                  "Medlemmen betalar externt och markerar sedan att betalningen är gjord",
                  "Kassören ser vem som markerat sig som betald och kontrollerar mot kontoutdraget",
                  "Lagkassan hanterar inte pengar — ingen kortinformation samlas in",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                    <IconCheck className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/signup"
              className="inline-block bg-accent text-white font-semibold px-5 py-2.5 rounded-md hover:bg-accent-hover transition-colors text-sm"
            >
              Skapa konto och kom igång
            </Link>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section className="bg-surface-alt border-t border-surface-border py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-text-primary mb-2">Vanliga frågor</h2>
            <p className="text-text-muted mb-10">Om tjänsten och hur flödet fungerar.</p>
            <div className="max-w-2xl">
              <FaqItem
                q="Behöver mina medlemmar registrera ett konto?"
                a="Nej. De klickar på länken, väljer sitt namn i listan och markerar betalningen. Inget konto, ingen nedladdning, ingen app."
              />
              <FaqItem
                q="Hanterar Lagkassan mina pengar?"
                a="Nej. Lagkassan hanterar inte pengar och samlar inte in kortuppgifter. Du anger egna betalningsinstruktioner — t.ex. Swish-nummer eller bankgiro — och medlemmarna betalar direkt till dig via sin bank. I Lagkassan markerar de sedan att betalningen är gjord, och du kontrollerar mot kontoutdraget."
              />
              <FaqItem
                q="Varför väljer medlemmen sitt namn från en lista?"
                a="Kassören skapar en namnlista när förfrågan skapas. Det gör det omöjligt att betala som fel person och ger kassören direkt koll på exakt vilka som inte betalat."
              />
              <FaqItem
                q="Kan jag ha flera lag under samma konto?"
                a="Ja. Du kan skapa flera team och hantera dem separat, med egna betalningsförfrågningar och betallistor för var och en."
              />
              <FaqItem
                q="Hur är projektet byggt?"
                a="Next.js 16 med App Router och Server Actions, Supabase (PostgreSQL + Row-Level Security) för databas och auth, Tailwind CSS för styling, och Vercel för deployment. Koden finns på GitHub."
              />
            </div>
          </div>
        </section>

        {/* ── CTA banner ────────────────────────────────────────────────────── */}
        <section className="bg-accent py-16">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Redo att testa med ditt lag?
            </h2>
            <p className="text-white/80 mb-8">
              Skapa ett konto, lägg upp en riktig förfrågan och se hur enkelt det blir för kassören att hålla koll.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="inline-block bg-white text-accent font-semibold px-6 py-3 rounded-md hover:bg-accent-light transition-colors"
              >
                Skapa konto
              </Link>
              <Link
                href="/login"
                className="inline-block bg-accent-hover text-white font-semibold px-6 py-3 rounded-md hover:bg-accent/80 transition-colors border border-white/20"
              >
                Logga in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border bg-surface py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-text-muted">
          <span className="font-semibold text-text-primary">Lagkassan</span>
          <p>Pilotfas — Lagkassan hanterar inte pengar. Betalningar sker via Swish eller bank.</p>
        </div>
      </footer>
    </div>
  );
}
