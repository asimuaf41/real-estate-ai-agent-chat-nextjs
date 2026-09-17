"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * When Supabase redirects auth failures to `/` (query or hash),
 * send the user to `/login` with a readable error message.
 */
export function AuthUrlErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(
      url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
    );

    const error =
      url.searchParams.get("error") || hashParams.get("error");
    const errorCode =
      url.searchParams.get("error_code") || hashParams.get("error_code");
    const errorDescription =
      url.searchParams.get("error_description") ||
      hashParams.get("error_description");

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
