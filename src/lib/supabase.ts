import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Realtime-only client. It never writes and never reads via PostgREST: every
 * mutation goes through the Nest API, which owns validation and authorization.
 * Returns null when unconfigured so the thread degrades to polling instead of
 * throwing at module load.
 */
let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) {
    return client;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client =
    url && anonKey
      ? createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return client;
}
