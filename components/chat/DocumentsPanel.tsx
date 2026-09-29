"use client";

import type { RagDocument } from "@/lib/chat/document-types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function DocumentsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-surface p-4">
          <Skeleton className="h-3 w-32" />
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
    <Card className="border-accent-cyan/20 bg-accent-cyan/5" padding="md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-cyan">
            Property database
          </p>
          <h2 className="mt-1 text-sm font-medium text-foreground">
            Indexed listings for vector search
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isLoading ? (
            <Badge tone="neutral">
              {documents.length} docs · {totalChunks} chunks
            </Badge>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={isEmpty ? onSeed : onForceSeed}
            loading={status === "seeding"}
            disabled={status === "seeding"}
          >
            {status === "seeding"
              ? isEmpty
                ? "Seeding..."
                : "Re-seeding..."
              : isEmpty
                ? "Seed Atlanta data"
                : "Re-seed"}
          </Button>
        </div>
      </div>

      {seedNotice ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-success/30 bg-success-muted px-3 py-2 text-xs text-success">
          <span>{seedNotice}</span>
          <button
            type="button"
            onClick={onDismissNotice}
            className="text-success transition hover:brightness-110"
            aria-label="Dismiss seed notice"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {isLoading ? <DocumentsSkeleton /> : null}

        {!isLoading && error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : null}

        {isEmpty && !error ? (
          <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-sm text-muted">
            No property documents indexed yet. Seed Atlanta sample listings to
            start asking questions.
          </p>
        ) : null}

        {!isLoading
          ? documents.map((doc) => (
              <article
                key={doc.sourceFile}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">
                        {String(doc.metadata?.region ?? "document")}
                      </Badge>
                      <span className="text-[11px] text-subtle">
                        {formatDate(doc.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 truncate text-sm font-medium text-foreground">
                      {doc.sourceFile}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {doc.chunkCount} embedded chunk
                      {doc.chunkCount === 1 ? "" : "s"}
                    </p>
                    {doc.preview ? (
                      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-subtle">
                        {doc.preview}
                        {doc.preview.length >= 200 ? "…" : ""}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(doc.sourceFile)}
                    disabled={status === "deleting"}
                    aria-label={`Delete document ${doc.sourceFile}`}
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
