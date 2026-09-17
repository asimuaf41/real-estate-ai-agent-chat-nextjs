import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function redirectToApp(request: Request, next: string) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

/**
 * OAuth + email confirmation callback.
 * Default Supabase Confirm email uses {{ .ConfirmationURL }}, which verifies
 * on Supabase then redirects here with ?code=... (PKCE).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  const authError = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (authError || errorCode) {
    const params = new URLSearchParams();
    if (authError) params.set("error", authError);
    if (errorCode) params.set("error_code", errorCode);
    if (errorDescription) params.set("error_description", errorDescription);
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return redirectToApp(request, next);
    }
    return NextResponse.redirect(
      `${origin}/login?error=otp_expired&error_description=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectToApp(request, next);
    }

    return NextResponse.redirect(
      `${origin}/login?error=auth&error_description=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth&error_description=${encodeURIComponent(
      "Missing auth code. Try signing in again or resend the confirmation email.",
    )}`,
  );
}
