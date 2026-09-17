import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function redirectToApp(request: NextRequest, next: string) {
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

function redirectToLogin(
  request: NextRequest,
  error: string,
  description: string,
) {
  const { origin } = new URL(request.url);
  const params = new URLSearchParams({
    error,
    error_description: description,
  });
  return NextResponse.redirect(`${origin}/login?${params.toString()}`);
}

/**
 * Handles both email confirmation styles:
 * 1) Custom template: ?token_hash=...&type=email → verifyOtp
 * 2) Default {{ .ConfirmationURL }} redirect: ?code=... → exchangeCodeForSession
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const authError = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (authError || errorCode) {
    return redirectToLogin(
      request,
      errorCode || authError || "auth",
      errorDescription || "Email confirmation failed.",
    );
  }

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return redirectToApp(request, next);
    }
    return redirectToLogin(
      request,
      "otp_expired",
      error.message || "Email link is invalid or has expired",
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectToApp(request, next);
    }
    return redirectToLogin(
      request,
      "auth",
      error.message || "Could not complete email confirmation.",
    );
  }

  return redirectToLogin(
    request,
    "confirm",
    "That confirmation link was incomplete. Enter your email and click Resend confirmation email, then use the newest link.",
  );
}
