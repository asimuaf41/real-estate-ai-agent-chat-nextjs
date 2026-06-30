import type { RagRetrievalChunk } from "@/lib/chat/document-types";
import type { ToolEvent } from "@/lib/chat/types";

function asChunks(value: unknown): RagRetrievalChunk[] {
  return Array.isArray(value) ? (value as RagRetrievalChunk[]) : [];
}

function getChunkSource(chunk: RagRetrievalChunk) {
  return chunk.sourceFile ?? chunk.source_file ?? "document";
}

function RetrievalSummary({ result }: { result: Record<string, unknown> }) {
  const query = String(result.query ?? "");
  const chunks = asChunks(result.chunks);
  const count = Number(result.count ?? chunks.length ?? 0);

  if (count === 0) {
    return (
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
        <p className="font-semibold text-cyan-50">
          Vector search · {query || "query"}
        </p>
        <p className="mt-1 text-zinc-300">
          No matching properties found in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
      <p className="font-semibold text-cyan-50">
        Retrieved {count} relevant chunk{count === 1 ? "" : "s"} ·{" "}
        <span className="text-cyan-200/80">{query}</span>
      </p>
      <ul className="mt-2 space-y-1.5">
        {chunks.slice(0, 4).map((chunk, index) => (
          <li key={chunk.id ?? index} className="text-zinc-300">
            <span className="text-cyan-200">
              {Math.round((chunk.similarity ?? 0) * 100)}%
            </span>{" "}
            · {getChunkSource(chunk)} ·{" "}
            <span className="text-zinc-400">
              {(chunk.snippet ?? "").slice(0, 120)}
              {(chunk.snippet ?? "").length > 120 ? "…" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RealEstateToolEvents({ events }: { events: ToolEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      {events.map((event, index) => {
        if (event.type === "tool_use") {
          const detail = event.input?.query;
          return (
            <p
              key={`tool-use-${index}`}
              className="text-[11px] font-medium uppercase tracking-wide text-cyan-300/80"
            >
              Retrieving from property database
              {detail ? ` · ${String(detail).slice(0, 80)}` : ""}
            </p>
          );
        }

        if (event.tool === "retrieve_properties" && event.result) {
          return (
            <RetrievalSummary
              key={`tool-result-${index}`}
              result={event.result}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
