import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({
  eyebrow,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "flex min-h-full flex-col justify-center px-1 py-4 sm:px-2",
        className,
      )}
    >
      <div className="w-full max-w-3xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className="mt-2 font-semibold tracking-tight text-foreground"
          style={{ fontSize: "var(--text-page)" }}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
