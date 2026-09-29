"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { assistants } from "@/config/assistants";
import { PRODUCT_NAME } from "@/lib/brand";
import { accentClasses, type AccentId } from "@/lib/ui/accent";
import { cn } from "@/lib/ui/cn";
import { ProductLogo } from "./ProductLogo";

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

function isAssistantActive(assistantId: string, path: string, pathname: string) {
  if (assistantId === "multi-agent") {
    return pathname === "/" || pathname.startsWith("/multi-agent");
  }
  if (assistantId === "web-search") {
    return pathname.startsWith("/web-search");
  }
  return pathname.startsWith(path);
}

type SidebarNavProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-border px-3 py-4",
          collapsed && "justify-center px-2",
        )}
      >
        <ProductLogo />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {PRODUCT_NAME}
            </p>
            <p className="truncate text-[11px] text-subtle">AI Workspace</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 p-2" aria-label="Assistants">
        {assistants.map((assistant) => {
          const isActive = isAssistantActive(
            assistant.id,
            assistant.path,
            pathname,
          );
          const accent = accentClasses[assistant.theme.accent as AccentId];

          return (
            <Link
              key={assistant.id}
              href={assistant.path}
              onClick={onNavigate}
              title={assistant.label}
              className={cn(
                "focus-ring flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition duration-(--duration-fast)",
                collapsed && "justify-center px-2",
                isActive
                  ? cn(accent.muted, accent.text, "ring-1", accent.border)
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {icons[assistant.id]}
              {!collapsed ? <span>{assistant.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
