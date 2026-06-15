import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role client — ONLY use server-side. Never import in client components.
// Bypasses RLS: use only when anon/user RLS would block a legitimate public read.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
