import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAuthConfig } from "@/lib/supabase/env";

type UpdateSessionResult = {
  supabaseResponse: NextResponse;
  user: User | null;
};

/**
 * Refreshes the Supabase auth session cookies on every matched request.
 * Uses private SUPABASE_URL + anon/publishable key — does not gate routes.
 */
export async function updateSession(
  request: NextRequest,
): Promise<UpdateSessionResult> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const config = getSupabaseAuthConfig();

  // Soft-fail: never block the app for guests if auth env is missing.
  if (!config) {
    return { supabaseResponse, user: null };
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Do not insert logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
