"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type UserMenuProps = {
  /** When set, Sign In opens the parent modal instead of navigating to /login. */
  onSignInClick?: () => void;
};

export function UserMenu({ onSignInClick }: UserMenuProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(currentUser);
        setIsLoading(false);
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (isMounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setError(null);
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
        setIsSigningOut(false);
        return;
      }

      router.push("/login");
      router.refresh();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Could not sign out. Please try again.",
      );
      setIsSigningOut(false);
    }
  }

  if (isLoading) {
    return (
      <div
        className="h-10 w-28 animate-pulse rounded-2xl border border-white/10 bg-black/30"
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    const signInClassName =
      "rounded-2xl border border-white/10 bg-black/30 px-3.5 py-2 text-sm font-medium text-zinc-100 backdrop-blur-md transition hover:border-amber-500/30 hover:bg-amber-500/5";

    if (onSignInClick) {
      return (
        <button type="button" onClick={onSignInClick} className={signInClassName}>
          Sign In
        </button>
      );
    }

    return (
      <Link href="/login" className={signInClassName}>
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
        <div className="min-w-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Signed in
          </p>
          <p
            className="max-w-56 truncate text-sm text-zinc-200"
            title={user.email ?? undefined}
          >
            {user.email ?? "Account"}
          </p>
        </div>
        <Link
            href="/dashboard"
            className="shrink-0 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-200 transition hover:border-orange-400/40 hover:bg-orange-500/20"
          >
            Dashboard
          </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSigningOut ? "Signing out..." : "Log out"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
