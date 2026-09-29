"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { UserMenu } from "@/app/components/UserMenu";
import { assistants } from "@/config/assistants";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { accentClasses, type AccentId } from "@/lib/ui/accent";
import { cn } from "@/lib/ui/cn";
import { HowItWorksButton } from "./HowItWorksButton";
import { SidebarNav } from "./SidebarNav";

function isAssistantActive(assistantId: string, path: string, pathname: string) {
  if (assistantId === "multi-agent") {
    return pathname === "/" || pathname.startsWith("/multi-agent");
  }
  if (assistantId === "web-search") {
    return pathname.startsWith("/web-search");
  }
  return pathname.startsWith(path);
}

const tabIcons: Record<string, ReactNode> = {
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

type AppShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  onSignInClick: () => void;
  children: ReactNode;
};

export function AppShell({
  title,
  description,
  eyebrow,
  onSignInClick,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-surface transition-[width] duration-(--duration-normal) lg:flex lg:flex-col",
          collapsed ? "w-[4.5rem]" : "w-60",
        )}
      >
        <SidebarNav collapsed={collapsed} />
        <div className="border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("w-full", collapsed && "px-0")}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              aria-hidden="true"
            >
              {collapsed ? (
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            {!collapsed ? <span>Collapse</span> : null}
          </Button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface shadow-lg">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col pb-[4.25rem] lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur-md">
          <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 shrink-0 px-0 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </Button>

            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-brand md:block">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base md:text-xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-0.5 hidden max-w-3xl text-sm leading-5 text-muted lg:line-clamp-2 lg:block">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="hidden md:inline-flex">
                <HowItWorksButton />
              </span>
              <ThemeToggle />
              <UserMenu onSignInClick={onSignInClick} compact />
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>

        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
          aria-label="Assistants"
        >
          <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1 p-1.5">
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
                  className={cn(
                    "focus-ring flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition duration-(--duration-fast)",
                    isActive
                      ? cn(accent.muted, accent.text)
                      : "text-muted hover:bg-surface-muted",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {tabIcons[assistant.id]}
                  <span className="truncate">{assistant.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
