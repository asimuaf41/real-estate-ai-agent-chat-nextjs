"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { MarkdownContent } from "./MarkdownContent";
import { TypingDots } from "./TypingDots";

function extractTitle(markdown: string) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || "Multi-Agent Report";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "report"
  );
}

type MultiAgentReportViewProps = {
  content: string;
  isStreaming?: boolean;
  emailRecipient?: string | null;
};

export function MultiAgentReportView({
  content,
  isStreaming = false,
  emailRecipient = null,
}: MultiAgentReportViewProps) {
  const { toast } = useToast();
  const title = useMemo(() => extractTitle(content), [content]);
  const actionsDisabled = isStreaming || !content.trim();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: "Copied to clipboard", tone: "success" });
    } catch {
      toast({ title: "Copy failed", tone: "error" });
    }
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${Date.now()}-${slugify(title)}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Report downloaded", tone: "success" });
  }

  function handleEmail() {
    const to = emailRecipient?.trim() || "";
    const body =
      content.length > 1800 ? `${content.slice(0, 1800)}\n\n…(truncated)` : content;
    const href = `mailto:${to}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    toast({ title: "Opening email client", tone: "neutral" });
  }

  return (
    <article className="overflow-hidden rounded-xl border border-brand-border bg-surface shadow-sm">
      <header className="flex flex-col gap-3 border-b border-border bg-brand-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            Final report
          </p>
          <h2 className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base">
            {title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={actionsDisabled}
            onClick={() => void handleCopy()}
          >
            Copy
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={actionsDisabled}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={actionsDisabled}
            onClick={handleEmail}
          >
            Email
          </Button>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-5">
        <MarkdownContent content={content} className="max-w-none" />
        {isStreaming ? (
          <p className="mt-3 text-sm text-muted">
            Writing report
            <TypingDots />
          </p>
        ) : null}
      </div>
    </article>
  );
}
