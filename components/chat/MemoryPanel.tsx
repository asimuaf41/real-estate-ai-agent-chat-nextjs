import type { MemoryItem } from "@/lib/chat/memory-types";

function MemorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-white/10 bg-black/20 p-4"
        >
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-3 h-3 w-full rounded bg-white/10" />
          <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
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
    <section className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300/80">
            Long-Term Memory
          </p>
          <h2 className="mt-1 text-sm font-medium text-zinc-100">
            Saved research & session context
          </h2>
        </div>
        {!isLoading ? (
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-400">
            {memories.length} saved
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? <MemorySkeleton /> : null}

        {!isLoading && error ? (
          <p className="text-xs text-rose-400">{error}</p>
        ) : null}

        {!isLoading && !error && memories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-zinc-500">
            No memories saved yet. Research something and the agent will store
            important findings here for future sessions.
          </p>
        ) : null}

        {!isLoading
          ? memories.map((memory) => (
              <article
                key={memory.id}
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-lg shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                        {memory.category}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {formatDate(memory.date)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-200">
                      {memory.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onDelete(memory.id)}
                    className="shrink-0 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
                    aria-label={`Delete memory ${memory.id}`}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          : null}
      </div>
    </section>
  );
}
