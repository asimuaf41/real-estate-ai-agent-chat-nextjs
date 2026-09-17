import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type BrowserAuthConfig = {
  url: string;
  anonKey: string;
};

declare global {
  interface Window {
    __SUPABASE_AUTH__?: BrowserAuthConfig;
  }
}

let browserClient: SupabaseClient | null = null;

function readBrowserAuthConfig(): BrowserAuthConfig {
  if (typeof window !== "undefined" && window.__SUPABASE_AUTH__?.url) {
    return window.__SUPABASE_AUTH__;
  }

  // Migration fallback if the layout script is unavailable.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser config missing. Set SUPABASE_URL + SUPABASE_ANON_KEY (or SUPABASE_KEY) on the server.",
    );
  }

  return { url, anonKey };
}

/**
 * Browser Supabase client for Client Components.
 * Session is stored in cookies via @supabase/ssr (not localStorage).
 *
 * Auth URL/anon key are injected at runtime from private server env
 * (see SupabaseConfigScript) — service role never reaches the browser.
 */
export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = readBrowserAuthConfig();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
