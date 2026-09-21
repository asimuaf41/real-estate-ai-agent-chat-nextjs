"use client";

import { useEffect, useId, useState } from "react";

const PRACTICES = [
  "Input validation on every API endpoint",
  "Automatic retry with exponential backoff on API failures",
  "Per-user rate limiting to prevent abuse and control costs",
  "Structured logging for production debugging",
  "React error boundaries for graceful UI failure handling",
  "Maximum iteration guards on agent loops",
];

export function ReliabilityNotes() {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white sm:text-xs"
      >
        Reliability
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close reliability notes"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 max-h-[min(36rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl shadow-black/40 sm:p-8"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:text-zinc-100"
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

            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
              Production hardening
            </p>
            <h2 id={titleId} className="mt-3 text-2xl font-semibold text-white">
              How these agents stay reliable
            </h2>

            <p className="mt-4 text-sm leading-6 text-zinc-300">
              My AI systems include:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-300">
              {PRACTICES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-6 text-zinc-400">
              When something fails — users see a clear message, the system recovers
              automatically where possible, and I can debug from logs without guessing.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
