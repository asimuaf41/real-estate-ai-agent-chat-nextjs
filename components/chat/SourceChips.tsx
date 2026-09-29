import { cn } from "@/lib/ui/cn";

type SourceChip = {
  title: string;
  url?: string;
};

export function SourceChips({
  sources,
  className,
}: {
  sources: SourceChip[];
  className?: string;
}) {
  if (sources.length === 0) return null;

  return (
    <div className={cn("mt-2 flex flex-wrap gap-1.5", className)}>
      {sources.map((source, index) => {
        const label = source.title || source.url || `Source ${index + 1}`;
        if (source.url) {
          return (
            <a
              key={`${label}-${index}`}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex max-w-[14rem] truncate rounded-md border border-border bg-surface-muted px-2 py-1 text-[11px] text-muted transition duration-(--duration-fast) hover:border-brand-border hover:text-brand"
              title={label}
            >
              {label}
            </a>
          );
        }
        return (
          <span
            key={`${label}-${index}`}
            className="inline-flex max-w-[14rem] truncate rounded-md border border-border bg-surface-muted px-2 py-1 text-[11px] text-muted"
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
