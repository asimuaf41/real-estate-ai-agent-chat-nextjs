"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";

const PRACTICES = [
  "Input validation on every API endpoint",
  "Automatic retry with exponential backoff on API failures",
  "Per-user rate limiting to prevent abuse and control costs",
  "Structured logging for production debugging",
  "React error boundaries for graceful UI failure handling",
  "Maximum iteration guards on agent loops",
];

export function HowItWorksButton() {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label="How it works"
      >
        How it works
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close how it works"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 max-h-[min(36rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-lg sm:p-8"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 h-9 w-9 px-0"
              onClick={() => setIsOpen(false)}
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
            </Button>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
              How Agent Desk works
            </p>
            <h2
              id={titleId}
              className="mt-3 font-semibold text-foreground"
              style={{ fontSize: "var(--text-page)" }}
            >
              Built for reliable multi-agent work
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Production safeguards include:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
              {PRACTICES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
