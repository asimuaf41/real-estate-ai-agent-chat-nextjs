"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { assistants } from "@/config/assistants";

const icons: Record<string, ReactNode> = {
  "web-search": (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  "real-estate": (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  weather: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 18a4 4 0 0 1-.3-8 5.5 5.5 0 0 1 10.6-1.5A4 4 0 1 1 17 18H7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "multi-agent": (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="5" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="19" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7.4 6.5 15.8M12 7.4l5.5 8.4M7.4 18h9.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export function AssistantSwitcher() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-1.5 backdrop-blur-md"
      aria-label="Switch assistant"
    >
      {assistants.map((assistant) => {
        const isActive =
          assistant.path === "/"
            ? pathname === "/"
            : pathname.startsWith(assistant.path);

        return (
          <Link
            key={assistant.id}
            href={assistant.path}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
              isActive
                ? "bg-white/10 text-white shadow-inner ring-1 ring-white/15"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
            ].join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {icons[assistant.id]}
            <span className="hidden sm:inline">{assistant.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
