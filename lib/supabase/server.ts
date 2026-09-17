import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseAuthConfig } from "@/lib/supabase/env";

/**
 * Server Supabase client for Server Components, Route Handlers, and Server Actions.
 * Uses private SUPABASE_URL + SUPABASE_ANON_KEY/SUPABASE_KEY (not NEXT_PUBLIC).
 *
 * Always prefer `supabase.auth.getUser()` on the server — never `getSession()`.
 *
 * Distinct from `lib/server/config/supabase.js` (service-role client for RAG/memory).
 */
export async function createClient() {
  const { url, anonKey } = requireSupabaseAuthConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Safe to ignore when proxy refreshes the session on each request.
        }
      },
    },
  });
}
