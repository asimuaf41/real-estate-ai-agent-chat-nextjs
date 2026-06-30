"use client";

import type { RagDocument } from "@/lib/chat/document-types";

function DocumentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-white/10 bg-black/20 p-4"
        >
          <div className="h-3 w-32 rounded bg-white/10" />
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

type DocumentsPanelProps = {
  documents: RagDocument[];
  isLoading: boolean;
  error: string;
  status: "idle" | "seeding" | "deleting";
  seedNotice: string;
  onSeed: () => void;
  onForceSeed: () => void;
  onDismissNotice: () => void;
  onDelete: (sourceFile: string) => void;
};

export function DocumentsPanel({
  documents,
  isLoading,
  error,
  status,
  seedNotice,
  onSeed,
  onForceSeed,
  onDismissNotice,
  onDelete,
}: DocumentsPanelProps) {
  const isEmpty = !isLoading && documents.length === 0;
  const totalChunks = documents.reduce(
    (sum, document) => sum + document.chunkCount,
    0,
  );

  return (
    <section className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            Property Database (RAG)
          </p>
          <h2 className="mt-1 text-sm font-medium text-zinc-100">
            Indexed listings retrieved by vector search
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isLoading ? (
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-zinc-400">
              {documents.length} document{documents.length === 1 ? "" : "s"} ·{" "}
              {totalChunks} chunks
            </span>
          ) : null}

          {isEmpty ? (
            <button
              type="button"
              onClick={onSeed}
              disabled={status === "seeding"}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "seeding" ? "Seeding..." : "Seed Atlanta data"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onForceSeed}
              disabled={status === "seeding"}
              className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "seeding" ? "Re-seeding..." : "Re-seed"}
            </button>
          )}
        </div>
      </div>

      {seedNotice ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <span>{seedNotice}</span>
          <button
            type="button"
            onClick={onDismissNotice}
            className="text-emerald-300 transition hover:text-emerald-100"
            aria-label="Dismiss seed notice"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {isLoading ? <DocumentsSkeleton /> : null}

        {!isLoading && error ? (
          <p className="text-xs text-rose-400">{error}</p>
        ) : null}

        {isEmpty && !error ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm text-zinc-500">
            No property documents indexed yet. Click{" "}
            <span className="font-medium text-cyan-300">Seed Atlanta data</span>{" "}
            to load the sample Buckhead, Midtown, Decatur, and Sandy Springs
            listings into the vector database.
          </p>
        ) : null}

        {!isLoading
          ? documents.map((doc) => (
              <article
                key={doc.sourceFile}
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-lg shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                        {String(doc.metadata?.region ?? "document")}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 truncate text-sm font-medium text-zinc-100">
                      {doc.sourceFile}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {doc.chunkCount} embedded chunk
                      {doc.chunkCount === 1 ? "" : "s"} ·{" "}
                      {String(doc.metadata?.type ?? "rag_document")}
                    </p>
                    {doc.preview ? (
                      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-zinc-500">
                        {doc.preview}
                        {doc.preview.length >= 200 ? "…" : ""}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(doc.sourceFile)}
                    disabled={status === "deleting"}
                    className="shrink-0 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Delete document ${doc.sourceFile}`}
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
