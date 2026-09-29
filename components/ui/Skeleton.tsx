import type { HTMLAttributes } from "react";
import { cn } from "@/lib/ui/cn";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-foreground/10",
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
