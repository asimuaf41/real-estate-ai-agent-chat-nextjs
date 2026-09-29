import type { MemoryItem } from "@/lib/chat/memory-types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function MemorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-surface p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type MemoryPanelProps = {
  memories: MemoryItem[];
  isLoading: boolean;
  error: string;
  onDelete: (memoryId: number) => Promise<void>;
};

export function MemoryPanel({
  memories,
  isLoading,
  error,
  onDelete,
}: MemoryPanelProps) {
  return (
    <Card className="border-accent-amber/20 bg-accent-amber/5" padding="md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-amber">
            Memory
          </p>
          <h2 className="mt-1 text-sm font-medium text-foreground">
            Saved research context
          </h2>
        </div>
        {!isLoading ? <Badge tone="neutral">{memories.length} saved</Badge> : null}
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? <MemorySkeleton /> : null}

        {!isLoading && error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : null}

        {!isLoading && !error && memories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-sm text-muted">
            No memories yet. Research something and key findings will appear here.
          </p>
        ) : null}

        {!isLoading
          ? memories.map((memory) => (
              <article
                key={memory.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="warning">{memory.category}</Badge>
                      <span className="text-[11px] text-subtle">
                        {formatDate(memory.date)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {memory.content}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void onDelete(memory.id)}
                    aria-label={`Delete memory ${memory.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))
          : null}
      </div>
    </Card>
  );
}
