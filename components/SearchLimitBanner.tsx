"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/ui/cn";
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
  const exhausted = remaining === 0;
  const lastOne = remaining === 1;

  const headline = exhausted
    ? "Free limit reached"
    : lastOne
      ? "1 free search left"
      : "Free trial";

  const detail = exhausted
    ? `You’ve used all ${freeLimit} free searches. Sign in for unlimited access.`
    : `${used} of ${freeLimit} used · ${remaining} remaining`;

  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3",
        exhausted
          ? "border-danger/30 bg-danger-muted"
          : lastOne
            ? "border-warning/30 bg-warning-muted"
            : "border-border bg-surface",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p
            className={cn(
              "text-sm font-semibold",
              exhausted
                ? "text-danger"
                : lastOne
                  ? "text-warning"
                  : "text-foreground",
            )}
          >
            {headline}
          </p>
          <p className="text-xs leading-5 text-muted">{detail}</p>
        </div>
        <Button
          type="button"
          variant={exhausted ? "destructive" : "secondary"}
          size="sm"
          onClick={onSignInClick}
        >
          Sign in
        </Button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-(--duration-normal)",
            exhausted ? "bg-danger" : lastOne ? "bg-warning" : "bg-brand",
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
