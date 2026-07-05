import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingSteps } from "../../OnboardingSteps";
import { TeamForm } from "./TeamForm";

export default async function NewTeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isFirstTeam = !count;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-7 pt-2">
      <div>
        <h1 className="text-[26px] leading-tight font-bold text-text-primary">
          {isFirstTeam ? "Skapa ditt första lag" : "Skapa nytt lag"}
        </h1>
        <p className="text-text-muted mt-1.5 text-sm leading-relaxed">
          {isFirstTeam
            ? "Ett lag kan vara ett åldersgrupp, en sektion, en klass eller vilken grupp som helst som ska betala något tillsammans. Du kan skapa fler senare."
            : "Ge laget eller gruppen ett namn — du kan ändra det senare."}
        </p>
      </div>

      {isFirstTeam && (
        <>
          <OnboardingSteps current={1} />
          <div className="bg-surface-alt/70 rounded-lg px-4 py-3.5 flex flex-col gap-1">
            <p className="text-xs text-text-muted leading-relaxed">
              Lagkassan hanterar inga pengar. Betalning sker via Swish/bank enligt kassörens instruktioner.
              Medlemmar rapporterar betalning själva, och kassören bekräftar efter kontroll.
            </p>
          </div>
        </>
      )}

      <TeamForm isFirstTeam={isFirstTeam} />
    </div>
  );
}
