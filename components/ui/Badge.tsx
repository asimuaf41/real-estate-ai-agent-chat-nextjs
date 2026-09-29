import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
};

const toneClasses = {
  neutral: "border-border bg-surface-muted text-muted",
  brand: "border-brand-border bg-brand-muted text-brand",
  success: "border-success/30 bg-success-muted text-success",
  warning: "border-warning/30 bg-warning-muted text-warning",
  danger: "border-danger/30 bg-danger-muted text-danger",
};

export function Badge({
  className,
  children,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  status,
}: {
  status: "idle" | "waiting" | "working" | "done" | "error";
}) {
  const tone =
    status === "working"
      ? "brand"
      : status === "done"
        ? "success"
        : status === "error"
          ? "danger"
          : "neutral";

  return <Badge tone={tone}>{status}</Badge>;
}
