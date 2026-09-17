import { getSupabaseAuthConfig } from "@/lib/supabase/env";

/**
 * Injects browser auth config from private server env (SUPABASE_URL + anon key).
 * Avoids requiring NEXT_PUBLIC_SUPABASE_* duplicates.
 *
 * Note: the anon/publishable key still reaches the browser (required for client auth).
 * It is not a secret — protect data with RLS. Never inject the service role key.
 */
export function SupabaseConfigScript() {
  const config = getSupabaseAuthConfig();

  if (!config) {
    return null;
  }

  const payload = JSON.stringify({
    url: config.url,
    anonKey: config.anonKey,
  });

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__SUPABASE_AUTH__=${payload};`,
      }}
    />
  );
}
