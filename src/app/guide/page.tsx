import Link from "next/link";

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

const STEPS = [
  {
    title: "Skapa ett lag/grupp",
    body: "Ge det ett namn — t.ex. ett testlag, en årskull eller en sektion.",
  },
  {
    title: "Lägg till några medlemmar",
    body: "Namnen du lägger till används när du skapar en betalningsförfrågan.",
  },
  {
    title: "Skapa en betalningsförfrågan",
    body: "Ange rubrik, belopp och eventuellt en sista betalningsdag.",
  },
  {
    title: "Lägg in Swish/bank-instruktioner",
    body: "Skriv t.ex. Swish-nummer eller bankgiro — det är detta medlemmarna ser.",
  },
  {
    title: "Dela den publika länken",
    body: "Skicka länken till gruppen. Medlemmarna behöver inget konto.",
  },
  {
    title: "Medlemmar markerar att de har betalat",
    body: "Efter att ha betalat via Swish/bank rapporterar medlemmen det i Lagkassan.",
  },
  {
    title: "Kassören kontrollerar Swish/bank och bekräftar betalningen",
    body: "Du stämmer av mot ditt konto och bekräftar varje rapporterad betalning.",
  },
];

export default function GuidePage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-surface-border bg-surface sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-text-primary tracking-tight">
            Lagkassan
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-accent text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors"
          >
            Skapa konto
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-accent-light text-accent text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Pilotfas · Gratis under pilotfasen
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">
          Så testar du Lagkassan
        </h1>
        <p className="text-text-muted leading-relaxed mb-10 max-w-xl">
          Sju enkla steg för att prova hela flödet — från att lägga upp ett lag till att bekräfta
          en betalning. Använd gärna ett testlag först innan du bjuder in riktiga medlemmar.
        </p>

        <ol className="flex flex-col gap-5 mb-10">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-accent-light text-accent font-bold text-sm flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-text-primary">{step.title}</p>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="bg-surface-alt border border-surface-border rounded-lg p-5 mb-10">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Bra att veta
          </p>
          <ul className="flex flex-col gap-2">
            {[
              "Lagkassan hanterar inga pengar",
              "Betalning sker direkt via Swish/bank",
              "Tjänsten är gratis under pilotfasen",
              "Använd gärna ett testlag först",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-text-primary">
                <IconCheck className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-text-primary">Testat klart?</p>
            <p className="text-sm text-text-muted mt-0.5">
              Skicka gärna feedback — det hjälper oss att göra Lagkassan bättre.
            </p>
          </div>
          <a
            href="mailto:hej@lagkassan.se?subject=Feedback%20om%20Lagkassan"
            className="inline-block bg-accent text-white font-semibold px-4 py-2 rounded-md hover:bg-accent-hover transition-colors text-sm whitespace-nowrap"
          >
            Skicka feedback
          </a>
        </div>
      </main>
    </div>
  );
}
