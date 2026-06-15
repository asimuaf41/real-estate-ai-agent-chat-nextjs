import type { ToolEvent } from "@/lib/chat/types";

function SearchResultCard({ result }: { result: Record<string, unknown> }) {
  const results = Array.isArray(result.results) ? result.results : [];

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
      <p className="font-semibold text-emerald-50">
        Web search · {String(result.query ?? "")}
      </p>
      {result.answer ? (
        <p className="mt-1 text-zinc-300">{String(result.answer)}</p>
      ) : null}
      {results.slice(0, 3).map((item, index) => {
        const entry = item as Record<string, unknown>;
        return (
          <p key={index} className="mt-1 truncate text-zinc-400">
            {String(entry.title ?? "Result")} — {String(entry.url ?? "")}
          </p>
        );
      })}
    </div>
  );
}

function YoutubeResultCard({ result }: { result: Record<string, unknown> }) {
  const videos = Array.isArray(result.videos) ? result.videos : [];

  return (
    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
      <p className="font-semibold text-rose-50">
        YouTube · {String(result.query ?? "")}
      </p>
      {videos.slice(0, 3).map((item, index) => {
        const video = item as Record<string, unknown>;
        return (
          <p key={index} className="mt-1 text-zinc-300">
            {String(video.title ?? "Video")} · {String(video.channel ?? "")}
          </p>
        );
      })}
    </div>
  );
}

export function WebSearchToolEvents({ events }: { events: ToolEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      {events.map((event, index) => {
        if (event.type === "tool_use") {
          const detail =
            event.input?.query ??
            event.input?.url ??
            event.input?.filename ??
            event.input?.content;
          return (
            <p
              key={`tool-use-${index}`}
              className="text-[11px] font-medium uppercase tracking-wide text-amber-300/80"
            >
              Running {event.tool}
              {detail ? ` · ${String(detail).slice(0, 80)}` : ""}
            </p>
          );
        }

        if (event.tool === "save_memory" && event.result) {
          const failed = event.result.success === false || event.result.error;
          return (
            <p
              key={`tool-result-${index}`}
              className={`text-xs ${failed ? "text-rose-300" : "text-emerald-300"}`}
            >
              {failed
                ? String(event.result.error ?? "Failed to save memory")
                : String(event.result.message ?? "Memory saved")}
            </p>
          );
        }

        if (event.tool === "search_memory" && event.result) {
          const found = Number(event.result.found ?? 0);
          return (
            <p key={`tool-result-${index}`} className="text-xs text-sky-300">
              {found === 0
                ? "No matching memories found."
                : `Found ${found} relevant ${found === 1 ? "memory" : "memories"}.`}
            </p>
          );
        }

        if (event.tool === "delete_memory" && event.result) {
          return (
            <p key={`tool-result-${index}`} className="text-xs text-rose-300">
              {String(event.result.message ?? "Memory deleted")}
            </p>
          );
        }

        if (event.tool === "search_web" && event.result) {
          return (
            <SearchResultCard
              key={`tool-result-${index}`}
              result={event.result}
            />
          );
        }

        if (event.tool === "search_youtube" && event.result) {
          return (
            <YoutubeResultCard
              key={`tool-result-${index}`}
              result={event.result}
            />
          );
        }

        if (event.tool === "read_url" && event.result) {
          return (
            <p key={`tool-result-${index}`} className="text-xs text-sky-300">
              Read page · {String(event.result.url ?? "")}
            </p>
          );
        }

        if (event.tool === "save_report" && event.result) {
          return (
            <p
              key={`tool-result-${index}`}
              className="text-xs text-emerald-300"
            >
              {String(event.result.message ?? "Report saved")}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
