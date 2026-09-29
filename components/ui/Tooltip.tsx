"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type TooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
};

export function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          id={id}
          className="absolute bottom-[calc(100%+0.4rem)] left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-elevated px-2 py-1 text-[11px] text-foreground shadow-md"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
