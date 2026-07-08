import Link from "next/link";

export const metadata = {
  title: "Integritetspolicy — Lagkassan",
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

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-text-primary mb-3">Integritetspolicy</h1>
        <p className="text-sm text-text-muted mb-10">Senast uppdaterad: 7 juli 2026</p>

        <div className="flex flex-col gap-10">
          <Section title="Vem är personuppgiftsansvarig?">
            <p>
              Valter Stålnacke är personuppgiftsansvarig för de personuppgifter som behandlas
              i Lagkassan. Har du frågor eller vill utöva någon av dina rättigheter enligt
              GDPR, kontakta{" "}
              <a href="mailto:hej@lagkassan.se" className="text-accent hover:underline">
                hej@lagkassan.se
              </a>
              .
            </p>
          </Section>

          <Section title="Lagkassan hanterar inga pengar">
            <p>
              Det är viktigt att förstå innan resten av policyn: Lagkassan är inte en
              betalningsförmedlare. Ingen kortinformation, inga bankuppgifter och inga
              transaktioner går via Lagkassan. Medlemmar betalar direkt till föreningens
              Swish-nummer eller bankgiro, och rapporterar sedan i appen att betalningen är
              gjord. Kassören kontrollerar det manuellt mot sitt kontoutdrag.
            </p>
          </Section>

          <Section title="Vilka uppgifter samlar vi in?">
            <p>Vilka uppgifter som lagras beror på vilken roll du har i tjänsten:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>
                <span className="font-medium text-text-primary">Kontoinnehavare (kassör/organisatör):</span>{" "}
                namn och e-postadress, kopplat till ditt inloggningskonto.
              </li>
              <li>
                <span className="font-medium text-text-primary">Föreningar/lag:</span>{" "}
                föreningens namn och eventuell beskrivning, inlagt av kontoinnehavaren.
              </li>
              <li>
                <span className="font-medium text-text-primary">Medlemslistor:</span> namn och
                eventuellt telefonnummer på lagets/föreningens medlemmar, inlagt av kassören för
                att kunna skapa betalningsförfrågningar riktade till specifika personer.
              </li>
              <li>
                <span className="font-medium text-text-primary">Betalningsrapporter:</span> namn
                och eventuell e-postadress på den som rapporterar en betalning, tidpunkt för
                rapportering, och belopp. Ingen betalkortsinformation samlas in eftersom
                Lagkassan aldrig hanterar själva betalningen.
              </li>
              <li>
                <span className="font-medium text-text-primary">Betalningsinstruktioner:</span>{" "}
                fritext som kassören själv skriver för att visa medlemmarna hur de ska betala
                (t.ex. ett Swish-nummer). Detta är uppgifter kassören själv väljer att
                publicera på den öppna betalningssidan.
              </li>
            </ul>
          </Section>

          <Section title="Varför behandlar vi uppgifterna?">
            <p>
              Uppgifterna behandlas för att tjänsten ska fungera: skapa och dela
              betalningsförfrågningar, visa vem som har rapporterat eller fått bekräftad
              betalning, och ge kassören en samlad översikt. Den rättsliga grunden är att
              behandlingen är nödvändig för att fullgöra avtalet om att tillhandahålla
              tjänsten till kontoinnehavaren, samt kontoinnehavarens berättigade intresse av
              att administrera sina föreningars förfrågningar.
            </p>
            <p>
              Om du är medlem i ett lag eller en förening som använder Lagkassan är det
              kassören/föreningen som lägger in ditt namn — inte du själv. Föreningen ansvarar
              för att informera sina medlemmar om att Lagkassan används och varför.
            </p>
          </Section>

          <Section title="Var lagras uppgifterna?">
            <p>
              Lagkassan använder Supabase (databas och inloggning) och Vercel (drift av
              webbplatsen) som personuppgiftsbiträden. Ingen data säljs eller delas med
              tredje part i marknadsföringssyfte, och ingen spårning eller
              analysinsamling sker på webbplatsen idag.
            </p>
          </Section>

          <Section title="Hur länge sparas uppgifterna?">
            <p>
              Uppgifter sparas så länge kontot eller förfrågan är aktiv. Du kan när som
              helst begära att ditt konto och tillhörande data raderas genom att kontakta{" "}
              <a href="mailto:hej@lagkassan.se" className="text-accent hover:underline">
                hej@lagkassan.se
              </a>
              . Är du en medlem vars namn lagts in av en kassör, kontakta i första hand
              kassören — annars hjälper vi dig direkt.
            </p>
          </Section>

          <Section title="Dina rättigheter">
            <p>Enligt GDPR har du rätt att:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>få veta vilka uppgifter vi har om dig (registerutdrag),</li>
              <li>få felaktiga uppgifter rättade,</li>
              <li>begära att dina uppgifter raderas,</li>
              <li>invända mot behandlingen,</li>
              <li>få ut dina uppgifter i ett strukturerat format (dataportabilitet),</li>
              <li>
                lämna klagomål till Integritetsskyddsmyndigheten (IMY) om du anser att dina
                uppgifter behandlas felaktigt.
              </li>
            </ul>
          </Section>

          <Section title="Cookies">
            <p>
              Lagkassan använder endast tekniskt nödvändiga cookies för inloggning
              (sessionshantering via Supabase). Vi använder inga analys- eller
              marknadsföringscookies.
            </p>
          </Section>

          <Section title="Ändringar av denna policy">
            <p>
              Lagkassan är i pilotfas och tjänsten utvecklas löpande. Vi kan komma att
              uppdatera denna policy och meddelar väsentliga ändringar via e-post eller i
              appen.
            </p>
          </Section>

          <Section title="Kontakt">
            <p>
              Frågor om denna policy eller din data? Mejla{" "}
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
