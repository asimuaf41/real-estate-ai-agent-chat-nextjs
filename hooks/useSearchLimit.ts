"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "agent_search_count";
const CHANGE_EVENT = "agent-search-count-change";
export const FREE_SEARCH_LIMIT = 3;

function readStoredCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = Number.parseInt(raw ?? "0", 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function writeStoredCount(count: number) {
  window.localStorage.setItem(STORAGE_KEY, String(count));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Tracks anonymous agent usage in localStorage.
 * Signed-in users are never limited.
 */
export function useSearchLimit() {
  const [count, setCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncCount = () => setCount(readStoredCount());
    syncCount();

    const supabase = createClient();
    let isMounted = true;

    async function loadAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setIsLoggedIn(Boolean(user));
        setIsReady(true);
      }
    }

    void loadAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        setIsLoggedIn(Boolean(session?.user));
        setIsReady(true);
      },
    );

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        syncCount();
      }
    };

    window.addEventListener(CHANGE_EVENT, syncCount);
    window.addEventListener("storage", onStorage);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener(CHANGE_EVENT, syncCount);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && readStoredCount() > 0) {
      writeStoredCount(0);
      setCount(0);
    }
  }, [isLoggedIn]);

  const getCount = useCallback(() => {
    if (typeof window === "undefined") {
      return count;
    }
    return readStoredCount();
  }, [count]);

  const incrementCount = useCallback(() => {
    if (isLoggedIn) {
      return getCount();
    }

    const next = readStoredCount() + 1;
    writeStoredCount(next);
    setCount(next);
    return next;
  }, [getCount, isLoggedIn]);

  const hasReachedLimit = useCallback(() => {
    if (isLoggedIn) {
      return false;
    }
    return readStoredCount() >= FREE_SEARCH_LIMIT;
  }, [isLoggedIn]);

  const resetCount = useCallback(() => {
    writeStoredCount(0);
    setCount(0);
  }, []);

  return {
    count,
    freeLimit: FREE_SEARCH_LIMIT,
    isLoggedIn,
    isReady,
    getCount,
    incrementCount,
    hasReachedLimit,
    resetCount,
  };
}
