"use client";

import { useSearchLimit } from "@/hooks/useSearchLimit";

type SearchLimitBannerProps = {
  onSignInClick: () => void;
};

export function SearchLimitBanner({ onSignInClick }: SearchLimitBannerProps) {
  const { count, freeLimit, isLoggedIn, isReady } = useSearchLimit();

  if (!isReady || isLoggedIn) {
    return null;
  }

  const used = Math.min(count, freeLimit);
  const remaining = Math.max(0, freeLimit - count);
  const progressPercent = Math.min(100, (used / freeLimit) * 100);

  const toneClasses =
    remaining === 0
      ? "border-rose-500/30 bg-rose-500/10"
      : remaining === 1
        ? "border-amber-500/30 bg-amber-500/10"
        : "border-white/10 bg-black/25";

  const textClasses =
    remaining === 0
      ? "text-rose-100"
      : remaining === 1
        ? "text-amber-100"
        : "text-zinc-200";

  const metaClasses =
    remaining === 0
      ? "text-rose-200/80"
      : remaining === 1
        ? "text-amber-200/80"
        : "text-zinc-400";

  const barClasses =
    remaining === 0
      ? "bg-rose-400"
      : remaining === 1
        ? "bg-amber-400"
        : "bg-amber-500/80";

  const buttonClasses =
    remaining === 0
      ? "border-rose-400/30 text-rose-100 hover:bg-rose-500/20"
      : remaining === 1
        ? "border-amber-400/30 text-amber-100 hover:bg-amber-500/20"
        : "border-white/15 text-zinc-100 hover:bg-white/10";

  const headline =
    remaining === 0
      ? "Free limit reached"
      : remaining === 1
        ? "Last free search remaining"
        : "Try before you sign up";

  const detail =
    remaining === 0
      ? `You used all ${freeLimit} free searches. Sign in for unlimited access and saved memory.`
      : `${used} of ${freeLimit} free searches used · ${remaining} remaining`;

  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 ${toneClasses}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={`text-sm font-semibold ${textClasses}`}>{headline}</p>
          <p className={`text-xs leading-5 ${metaClasses}`}>{detail}</p>
        </div>
        <button
          type="button"
          onClick={onSignInClick}
          className={`shrink-0 rounded-xl border bg-black/20 px-3 py-1.5 text-xs font-semibold transition ${buttonClasses}`}
        >
          {remaining === 0 ? "Sign in now" : "Sign in"}
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClasses}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className={`mt-2 flex items-center justify-between text-[11px] ${metaClasses}`}>
        <span>
          Free plan · {used}/{freeLimit}
        </span>
        <span>
          {remaining === 0 ? "Unlimited after sign-in" : `${remaining} left`}
        </span>
      </div>
    </div>
  );
}
