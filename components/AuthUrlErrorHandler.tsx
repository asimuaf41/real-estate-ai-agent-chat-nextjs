"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Handles auth query/hash leftovers on any page:
 * - error=* → /login with a readable message
 * - code=* on `/` (Site URL fallback) → /auth/callback to finish PKCE
 */
export function AuthUrlErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(
      url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
    );

    const code = url.searchParams.get("code") || hashParams.get("code");
    const error =
      url.searchParams.get("error") || hashParams.get("error");
    const errorCode =
      url.searchParams.get("error_code") || hashParams.get("error_code");
    const errorDescription =
      url.searchParams.get("error_description") ||
      hashParams.get("error_description");

    // Supabase sometimes redirects to Site URL root with ?code= instead of /auth/callback.
    if (code && !error && !errorCode) {
      const params = new URLSearchParams({ code, next: "/" });
      router.replace(`/auth/callback?${params.toString()}`);
      return;
    }

    if (!error && !errorCode && !errorDescription) {
      return;
    }

    const params = new URLSearchParams();
    if (error) params.set("error", error);
    if (errorCode) params.set("error_code", errorCode);
    if (errorDescription) params.set("error_description", errorDescription);

    router.replace(`/login?${params.toString()}`);
  }, [router]);

  return null;
}
