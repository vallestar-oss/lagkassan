import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Liveness + database check. Runs a real (empty) query so it also counts as
// database activity — Supabase pauses free projects after ~a week of
// inactivity, which is exactly what took the site down before. Pinged on a
// schedule by .github/workflows/keep-alive.yml. Exposes no details on purpose.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("get_public_collection", {
      p_slug: "__health-check__",
    });
    if (error) throw error;
    return NextResponse.json({ status: "ok" }, { headers });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers });
  }
}
