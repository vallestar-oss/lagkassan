import { describe, expect, it } from "vitest";
import { assertCollectionRole, assertTeamRole } from "./auth";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
type User = { id: string };

// Minimal fake Supabase client covering just the calls assertTeamRole and
// assertCollectionRole make: auth.getUser(), and from(table).select().eq().
// (.eq()).maybeSingle(). Not a general-purpose mock — enough to drive the
// role-check branches without a real database.
function fakeSupabase(opts: {
  user?: User | null;
  teamMemberRole?: string | null;
  collectionTeamId?: string | null;
}): Client {
  const { user = null, teamMemberRole = null, collectionTeamId = null } = opts;

  const client = {
    auth: {
      getUser: async () => ({ data: { user } }),
    },
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => {
          if (table === "team_members") {
            return { data: teamMemberRole ? { role: teamMemberRole } : null };
          }
          if (table === "collections") {
            return { data: collectionTeamId ? { team_id: collectionTeamId } : null };
          }
          throw new Error(`fakeSupabase: unexpected table "${table}"`);
        },
      };
      return builder;
    },
  };

  return client as unknown as Client;
}

describe("assertTeamRole", () => {
  it("rejects an unauthenticated caller", async () => {
    const supabase = fakeSupabase({ user: null });
    const result = await assertTeamRole(supabase, "team-1", ["owner"]);
    expect(result.error).toBe("Inte inloggad.");
    expect(result.user).toBeNull();
  });

  it("rejects a missing teamId", async () => {
    const supabase = fakeSupabase({ user: { id: "u1" } });
    const result = await assertTeamRole(supabase, "", ["owner"]);
    expect(result.error).toBe("Ogiltig förening.");
  });

  it("rejects a caller with no membership row", async () => {
    const supabase = fakeSupabase({ user: { id: "u1" }, teamMemberRole: null });
    const result = await assertTeamRole(supabase, "team-1", ["owner", "treasurer"]);
    expect(result.error).toBe("Du har inte behörighet för den här åtgärden.");
  });

  it("rejects a member whose role isn't in the allowed list", async () => {
    const supabase = fakeSupabase({ user: { id: "u1" }, teamMemberRole: "member" });
    const result = await assertTeamRole(supabase, "team-1", ["owner", "treasurer"]);
    expect(result.error).toBe("Du har inte behörighet för den här åtgärden.");
  });

  it("allows a member whose role is in the allowed list", async () => {
    const supabase = fakeSupabase({ user: { id: "u1" }, teamMemberRole: "treasurer" });
    const result = await assertTeamRole(supabase, "team-1", ["owner", "treasurer"]);
    expect(result.error).toBeNull();
    expect(result.user).toEqual({ id: "u1" });
  });
});

describe("assertCollectionRole", () => {
  it("reports a missing collection", async () => {
    const supabase = fakeSupabase({ user: { id: "u1" }, collectionTeamId: null });
    const result = await assertCollectionRole(supabase, "col-1", ["owner"]);
    expect(result.error).toBe("Förfrågan hittades inte.");
  });

  it("resolves the team from the collection and applies the same role check", async () => {
    const supabase = fakeSupabase({
      user: { id: "u1" },
      collectionTeamId: "team-9",
      teamMemberRole: "member",
    });
    const result = await assertCollectionRole(supabase, "col-1", ["owner", "treasurer"]);
    expect(result.teamId).toBe("team-9");
    expect(result.error).toBe("Du har inte behörighet för den här åtgärden.");
  });

  it("allows an authorized treasurer through", async () => {
    const supabase = fakeSupabase({
      user: { id: "u1" },
      collectionTeamId: "team-9",
      teamMemberRole: "treasurer",
    });
    const result = await assertCollectionRole(supabase, "col-1", ["owner", "treasurer"]);
    expect(result.error).toBeNull();
    expect(result.teamId).toBe("team-9");
  });
});
