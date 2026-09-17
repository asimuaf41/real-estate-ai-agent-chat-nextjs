/**
 * Server-side Supabase auth config.
 * Prefers private env vars (no NEXT_PUBLIC required).
 * Optional NEXT_PUBLIC_* values remain as migration fallbacks only.
 */
export type SupabaseAuthConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseAuthConfig(): SupabaseAuthConfig | null {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";

  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabaseAuthConfig(): SupabaseAuthConfig {
  const config = getSupabaseAuthConfig();
  if (!config) {
    throw new Error(
      "Missing Supabase auth config. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_KEY).",
    );
  }
  return config;
}
