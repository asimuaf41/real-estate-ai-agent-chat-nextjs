import type { ToolEvent } from "@/lib/chat/types";
import { SourceChips } from "../SourceChips";

function SearchResultCard({ result }: { result: Record<string, unknown> }) {
  const results = Array.isArray(result.results) ? result.results : [];
  const sources = results.slice(0, 5).map((item) => {
    const entry = item as Record<string, unknown>;
    return {
      title: String(entry.title ?? "Source"),
      url: typeof entry.url === "string" ? entry.url : undefined,
    };
  });

  return (
    <div className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">
        Web search · {String(result.query ?? "")}
      </p>
      {result.answer ? (
        <p className="mt-1 text-muted">{String(result.answer)}</p>
      ) : null}
      <SourceChips sources={sources} />
    </div>
  );
}

function YoutubeResultCard({ result }: { result: Record<string, unknown> }) {
  const videos = Array.isArray(result.videos) ? result.videos : [];
  const sources = videos.slice(0, 5).map((item) => {
    const video = item as Record<string, unknown>;
    return {
      title: String(video.title ?? "Video"),
      url: typeof video.url === "string" ? video.url : undefined,
    };
  });

  return (
    <div className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">
        YouTube · {String(result.query ?? "")}
      </p>
      <SourceChips sources={sources} />
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
              className="text-[11px] font-medium uppercase tracking-wide text-accent-amber"
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
              className={`text-xs ${failed ? "text-danger" : "text-success"}`}
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
            <p key={`tool-result-${index}`} className="text-xs text-muted">
              {found === 0
                ? "No matching memories found."
                : `Found ${found} relevant ${found === 1 ? "memory" : "memories"}.`}
            </p>
          );
        }

        if (event.tool === "delete_memory" && event.result) {
          return (
            <p key={`tool-result-${index}`} className="text-xs text-danger">
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
            <p key={`tool-result-${index}`} className="text-xs text-muted">
              Read page · {String(event.result.url ?? "")}
            </p>
          );
        }

        if (event.tool === "save_report" && event.result) {
          return (
            <p key={`tool-result-${index}`} className="text-xs text-success">
              {String(event.result.message ?? "Report saved")}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
