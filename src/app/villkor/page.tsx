import Link from "next/link";

export const metadata = {
  title: "Användarvillkor — Lagkassan",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <div className="text-sm text-text-muted leading-relaxed flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-text-primary mb-3">Användarvillkor</h1>
        <p className="text-sm text-text-muted mb-10">Senast uppdaterad: 7 juli 2026</p>

        <div className="flex flex-col gap-10">
          <Section title="Om tjänsten">
            <p>
              Lagkassan är i pilotfas och tillhandahålls av Valter Stålnacke. Tjänsten är
              gratis under pilotfasen. Genom att skapa ett konto godkänner du dessa villkor.
            </p>
            <p>
              Lagkassan hjälper föreningar, lag och grupper att skapa betalningsförfrågningar,
              dela en länk med medlemmarna, och hålla koll på vem som har rapporterat eller
              fått bekräftad betalning.
            </p>
          </Section>

          <Section title="Vad Lagkassan inte gör">
            <p>
              Lagkassan är <span className="font-medium text-text-primary">inte</span> en
              betalningsförmedlare och hanterar aldrig pengar. Vi är inte part i
              transaktionen mellan medlem och kassör — betalningen sker alltid direkt via
              Swish eller bank mellan dessa två parter. Lagkassan sparar enbart en status
              (rapporterad eller bekräftad) baserat på vad medlemmen respektive kassören
              själva anger i appen. Vi kontrollerar inte att en betalning faktiskt har skett.
            </p>
          </Section>

          <Section title="Kontoinnehavarens (kassörens) ansvar">
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>
                Du ansvarar för att de uppgifter du lägger in om lagets/föreningens
                medlemmar (namn, telefonnummer) är korrekta och att du har rätt att
                registrera dem i tjänsten.
              </li>
              <li>
                Du ansvarar för att kontrollera varje rapporterad betalning mot ditt eget
                kontoutdrag eller Swish-app innan du bekräftar den i Lagkassan.
              </li>
              <li>
                Du ansvarar för de betalningsinstruktioner (t.ex. Swish-nummer) du publicerar
                på den öppna betalningssidan.
              </li>
              <li>
                Du får inte använda tjänsten för olagliga insamlingar eller för att samla in
                pengar under falska premisser.
              </li>
            </ul>
          </Section>

          <Section title="Medlemmar och betalare">
            <p>
              Den som betalar via en delad länk behöver inget konto. De uppgifter en betalare
              anger (namn, eventuell e-postadress) är frivilliga och används endast för att
              visa kassören vem som har betalat.
            </p>
          </Section>

          <Section title="Pilotfas och tillgänglighet">
            <p>
              Tjänsten tillhandahålls i befintligt skick under pilotfasen. Vi lämnar inga
              garantier för oavbruten drift, felfrihet eller att funktioner förblir
              oförändrade. Vi förbehåller oss rätten att ändra eller stänga ner tjänsten med
              rimligt varsel.
            </p>
          </Section>

          <Section title="Ansvarsbegränsning">
            <p>
              Eftersom Lagkassan aldrig hanterar pengar eller är part i betalningen, ansvarar
              vi inte för uteblivna, felaktiga eller bestridda betalningar mellan medlem och
              kassör. Sådana tvister är en fråga mellan de inblandade parterna, inte
              Lagkassan.
            </p>
          </Section>

          <Section title="Uppsägning">
            <p>
              Du kan när som helst avsluta ditt konto genom att kontakta{" "}
              <a href="mailto:hej@lagkassan.se" className="text-accent hover:underline">
                hej@lagkassan.se
              </a>
              . Vi förbehåller oss rätten att stänga av konton som missbrukar tjänsten eller
              bryter mot dessa villkor.
            </p>
          </Section>

          <Section title="Ändringar av villkoren">
            <p>
              Vi kan komma att uppdatera dessa villkor under pilotfasen. Väsentliga ändringar
              meddelas via e-post eller i appen.
            </p>
          </Section>

          <Section title="Tillämplig lag">
            <p>Svensk lag tillämpas på dessa villkor.</p>
          </Section>

          <Section title="Kontakt">
            <p>
              Frågor om dessa villkor? Mejla{" "}
              <a href="mailto:hej@lagkassan.se" className="text-accent hover:underline">
                hej@lagkassan.se
              </a>
              .
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
