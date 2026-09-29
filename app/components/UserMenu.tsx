"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/ui/cn";

type UserMenuProps = {
  /** When set, Sign In opens the parent modal instead of navigating to /login. */
  onSignInClick?: () => void;
  compact?: boolean;
};

export function UserMenu({ onSignInClick, compact = false }: UserMenuProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);

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
        className={cn(
          "animate-pulse rounded-lg border border-border bg-surface-muted",
          compact ? "h-8 w-8" : "h-9 w-20",
        )}
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    if (onSignInClick) {
      return (
        <Button type="button" variant="secondary" size="sm" onClick={onSignInClick}>
          Sign In
        </Button>
      );
    }

    return (
      <Link
        href="/login"
        className="focus-ring inline-flex h-8 items-center rounded-md border border-border bg-surface px-2.5 text-xs font-semibold text-foreground"
      >
        Sign In
      </Link>
    );
  }

  const initials = (user.email ?? "A").slice(0, 1).toUpperCase();

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={cn(compact ? "h-8 w-8 px-0" : "gap-2")}
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 text-[11px] font-semibold text-brand">
          {initials}
        </span>
        {!compact ? (
          <span className="hidden max-w-28 truncate sm:inline">
            {user.email?.split("@")[0] ?? "Account"}
          </span>
        ) : null}
      </Button>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close account menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-[calc(100%+0.4rem)] right-0 z-50 w-52 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
          >
            <p className="truncate px-2.5 py-2 text-xs text-muted" title={user.email ?? undefined}>
              {user.email ?? "Account"}
            </p>
            <Link
              href="/dashboard"
              role="menuitem"
              className="focus-ring block rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-surface-muted"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
              className="focus-ring block w-full rounded-lg px-2.5 py-2 text-left text-sm text-danger hover:bg-danger-muted disabled:opacity-60"
            >
              {isSigningOut ? "Signing out..." : "Log out"}
            </button>
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="absolute top-full right-0 mt-1 whitespace-nowrap text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
