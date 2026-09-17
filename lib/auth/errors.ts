/**
 * Maps Supabase auth URL error codes to user-friendly copy.
 */
export function getAuthErrorMessage(
  error: string | null,
  errorCode: string | null,
  errorDescription: string | null,
): string | null {
  const code = (errorCode || error || "").toLowerCase();
  const description = (errorDescription || "").replace(/\+/g, " ").trim();

  if (!code && !description) {
    return null;
  }

  if (
    code.includes("otp_expired") ||
    description.toLowerCase().includes("invalid or has expired")
  ) {
    return "That email confirmation link is invalid or has expired. Enter your email below and click Resend confirmation email.";
  }

  if (code === "access_denied" || code.includes("access_denied")) {
    return (
      description ||
      "Access was denied. Please try signing in again or request a new confirmation email."
    );
  }

  if (code === "confirm" || description.toLowerCase().includes("missing confirmation")) {
    return "That confirmation link was incomplete. Enter your email and click Resend confirmation email, then use the newest link.";
  }

  if (code === "auth") {
    return (
      description ||
      "Authentication failed. Please try again or request a new confirmation email."
    );
  }

  return description || "Authentication failed. Please try again.";
}

/**
 * Canonical app origin for auth redirects (email confirm, OAuth).
 * Prefer SITE_URL / NEXT_PUBLIC_SITE_URL in production so emails never
 * fall back to a localhost Site URL misconfiguration alone.
 */
export function getAppOrigin(fallbackOrigin?: string): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "";

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (fallbackOrigin) {
    return fallbackOrigin.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "";
}

/**
 * Where Supabase should send the user after clicking the email link.
 * Use /auth/callback with the default {{ .ConfirmationURL }} template
 * (Supabase verifies first, then redirects here with ?code=...).
 */
export function getEmailRedirectTo(origin?: string, nextPath = "/") {
  const next = nextPath.startsWith("/") ? nextPath : "/";
  const base = getAppOrigin(origin);
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function getOAuthRedirectTo(origin?: string, nextPath = "/") {
  return getEmailRedirectTo(origin, nextPath);
}
