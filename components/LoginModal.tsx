"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { getEmailRedirectTo, getOAuthRedirectTo } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const titleId = useId();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setMode("login");
      setEmail("");
      setPassword("");
      setError(null);
      setInfo(null);
      setIsSubmitting(false);
      setIsResending(false);
      setShowResend(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

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
          emailRedirectTo: getEmailRedirectTo(window.location.origin),
        },
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setInfo(
        "A new confirmation email was sent. Use the latest link in your inbox.",
      );
      setShowResend(true);
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Could not resend confirmation email.",
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
            emailRedirectTo: getEmailRedirectTo(window.location.origin),
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (!data.session) {
          setInfo(
            "Check your email and click the confirmation link. Then sign in here.",
          );
          setMode("login");
          setShowResend(true);
          return;
        }
      }

      onSuccess();
      onClose();
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
      const nextPath = `${window.location.pathname}${window.location.search}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close login dialog"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="focus-ring absolute top-4 right-4 rounded-lg border border-border bg-surface-muted p-2 text-muted transition hover:text-foreground"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
          Continue with Agent Desk
        </p>
        <h2 id={titleId} className="mt-3 pr-8 text-2xl font-semibold text-foreground">
          Sign in to keep going
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          You’ve used your free searches. Create an account for unlimited access
          and saved memory.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={[
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              mode === "login"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={[
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              mode === "signup"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            ].join(" ")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-muted">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="focus-ring w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-subtle"
              placeholder="you@company.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Password</span>
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
              className="focus-ring w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-subtle"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger-muted px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          {info ? (
            <p
              role="status"
              className="rounded-xl border border-success/30 bg-success-muted px-4 py-3 text-sm text-success"
            >
              {info}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Sign in to continue"
                : "Create account"}
          </button>

          {mode === "login" || showResend ? (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={isSubmitting || isResending}
              className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending
                ? "Sending confirmation email..."
                : "Resend confirmation email"}
            </button>
          ) : null}
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.18em] text-subtle">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-medium text-foreground transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </div>
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
        d="M3.2 7.1C2.4 8.7 2 10.3 2 12s.4 3.3 1.2 4.9c0 .1 3.4-2.6 3.4-2.6-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.2 7.1z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.8c1.5 0 2.8.5 3.9 1.5l2.9-2.9C16.9 2.7 14.7 2 12 2 8.1 2 4.8 4.3 3.2 7.1l3.4 2.6C7 7.7 9.2 5.8 12 5.8z"
      />
    </svg>
  );
}
