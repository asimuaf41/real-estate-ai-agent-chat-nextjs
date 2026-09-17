"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthErrorMessage, getEmailRedirectTo, getOAuthRedirectTo } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_40%),linear-gradient(180deg,#070b14_0%,#0b1220_45%,#070b14_100%)] px-4 py-12">
          <div className="h-80 w-full max-w-md animate-pulse rounded-3xl border border-white/10 bg-zinc-900/50" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams],
  );

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() =>
    getAuthErrorMessage(
      searchParams.get("error"),
      searchParams.get("error_code"),
      searchParams.get("error_description"),
    ),
  );
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResend, setShowResend] = useState(() => {
    const code = searchParams.get("error_code") || searchParams.get("error") || "";
    return code.toLowerCase().includes("otp") || code.toLowerCase().includes("confirm");
  });

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setInfo(null);
  }

  async function handleResendConfirmation() {
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Enter your email address first, then resend confirmation.");
      return;
    }

    setIsResending(true);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: getEmailRedirectTo(
            window.location.origin,
            nextPath,
          ),
        },
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setInfo(
        "A new confirmation email was sent. Check your inbox (and spam), then click the latest link.",
      );
      setShowResend(true);
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Could not resend confirmation email. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getEmailRedirectTo(
              window.location.origin,
              nextPath,
            ),
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (!data.session) {
          setInfo(
            "Check your email and click the confirmation link. Then come back here to sign in.",
          );
          setMode("login");
          setShowResend(true);
          return;
        }
      }

      router.push(nextPath);
      router.refresh();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const redirectTo = getOAuthRedirectTo(window.location.origin, nextPath);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setIsSubmitting(false);
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Google sign-in failed. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_40%),linear-gradient(180deg,#070b14_0%,#0b1220_45%,#070b14_100%)] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
          AI Agent Workspace
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {mode === "login"
            ? "Sign in to access your research, real estate, and weather assistants."
            : "Sign up to start using the premium B2B assistant workspace."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={[
              "rounded-xl px-3 py-2 text-sm font-medium transition",
              mode === "login"
                ? "bg-amber-500/20 text-amber-100"
                : "text-zinc-400 hover:text-zinc-200",
            ].join(" ")}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={[
              "rounded-xl px-3 py-2 text-sm font-medium transition",
              mode === "signup"
                ? "bg-amber-500/20 text-amber-100"
                : "text-zinc-400 hover:text-zinc-200",
            ].join(" ")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400/40 focus:ring-2 focus:ring-amber-500/20"
              placeholder="you@company.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-300">Password</span>
            <input
              type="password"
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400/40 focus:ring-2 focus:ring-amber-500/20"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            >
              {error}
            </p>
          ) : null}

          {info ? (
            <p
              role="status"
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            >
              {info}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || isResending}
            className="w-full rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>

          {mode === "login" || showResend ? (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={isSubmitting || isResending}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-amber-500/30 hover:bg-amber-500/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending
                ? "Sending confirmation email..."
                : "Resend confirmation email"}
            </button>
          ) : null}
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            or
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-amber-500/30 hover:bg-amber-500/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.2 0-.7-.1-1.4-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M6.6 14.3l-.9.7-2.5 1.9C4.8 19.7 8.1 22 12 22c2.7 0 5-.9 6.7-2.4l-3.1-2.4c-.9.6-2 1-3.6 1-2.8 0-5.1-1.9-6-4.4z"
      />
      <path
        fill="#4A90E2"
        d="M3.2 7.1C2.4 8.7 2 10.3 2 12s.4 3.3 1.2 4.9c0 .1 3.4-2.6 3.4-2.6-.2-.6-.3-1.2-.3-1.9L3.2 7.1z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.8c1.5 0 2.8.5 3.9 1.5l2.9-2.9C16.9 2.7 14.7 2 12 2 8.1 2 4.8 4.3 3.2 7.1l3.4 2.6C7 7.7 9.2 5.8 12 5.8z"
      />
    </svg>
  );
}
