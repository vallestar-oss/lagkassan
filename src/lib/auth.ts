import type { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type Client = Awaited<ReturnType<typeof createClient>>;
type Role = "owner" | "treasurer" | "member";

export type AuthResult = { user: User | null; error: string | null; teamId?: string };

const NOT_LOGGED_IN = "Inte inloggad.";
const UNAUTHORIZED = "Du har inte behörighet för den här åtgärden.";

/**
 * Defense-in-depth role check for server actions. RLS is the last line of
 * defense, but the public payment write path (src/app/p/[slug]/actions.ts)
 * runs through a service-role client that bypasses RLS entirely, so its own
 * validation is the only gate there — server actions must NOT rely on RLS alone.
 *
 * Verifies the current user is a member of `teamId` with one of `roles`.
 * Returns the resolved `user` (handy for created_by etc.) and a Swedish error
 * string when the caller is unauthenticated or lacks the role.
 */
export async function assertTeamRole(
  supabase: Client,
  teamId: string,
  roles: Role[],
): Promise<AuthResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, error: NOT_LOGGED_IN };
  if (!teamId) return { user, error: "Ogiltig förening." };

  // RLS lets a member read their own team_members rows; a non-member gets no
  // row back, which we treat as unauthorized.
  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || !roles.includes(data.role as Role))
    return { user, error: UNAUTHORIZED };

  return { user, error: null };
}

/**
 * Same as assertTeamRole but resolves the team from a collection id first.
 * Used by payment/collection actions that only carry a collectionId.
 */
export async function assertCollectionRole(
  supabase: Client,
  collectionId: string,
  roles: Role[],
): Promise<AuthResult> {
  const { data: col } = await supabase
    .from("collections")
    .select("team_id")
    .eq("id", collectionId)
    .maybeSingle();

  if (!col) return { user: null, error: "Förfrågan hittades inte." };

  const result = await assertTeamRole(supabase, col.team_id, roles);
  return { ...result, teamId: col.team_id };
}
