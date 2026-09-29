"use client";

import { useMemo, useState, type ReactNode } from "react";
import { TypingDots } from "./TypingDots";

type InlineNode = string | { type: "strong" | "em" | "code"; text: string };

type MdBlock =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "paragraph"; nodes: InlineNode[] }
  | { type: "ul" | "ol"; items: InlineNode[][] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "blockquote"; nodes: InlineNode[] };

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push({ type: "strong", text: token.slice(2, -2) });
    } else if (token.startsWith("*")) {
      nodes.push({ type: "em", text: token.slice(1, -1) });
    } else {
      nodes.push({ type: "code", text: token.slice(1, -1) });
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function renderInline(nodes: InlineNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof node === "string") return <span key={key}>{node}</span>;
    if (node.type === "strong") {
      return (
        <strong key={key} className="font-semibold text-zinc-50">
          {node.text}
        </strong>
      );
    }
    if (node.type === "em") {
      return (
        <em key={key} className="italic text-zinc-200">
          {node.text}
        </em>
      );
    }
    return (
      <code
        key={key}
        className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-emerald-200"
      >
        {node.text}
      </code>
    );
  });
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim());
}

export function parseReportMarkdown(markdown: string): MdBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      index += 1;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      index += 1;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({
        type: "blockquote",
        nodes: parseInline(quoteLines.join(" ")),
      });
      continue;
    }

    if (
      trimmed.includes("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      const headers = splitTableRow(trimmed);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|")) {
        const row = lines[index].trim();
        if (!row || isTableSeparator(row)) {
          index += 1;
          continue;
        }
        rows.push(splitTableRow(row));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: InlineNode[][] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(parseInline(lines[index].trim().replace(/^[-*]\s+/, "")));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: InlineNode[][] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(parseInline(lines[index].trim().replace(/^\d+\.\s+/, "")));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("#") &&
      !lines[index].trim().startsWith(">") &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[index].trim()) &&
      !(
        lines[index].includes("|") &&
        index + 1 < lines.length &&
        isTableSeparator(lines[index + 1])
      )
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({
      type: "paragraph",
      nodes: parseInline(paragraphLines.join(" ")),
    });
  }

  return blocks;
}

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

type PropertyStat = { label: string; value: string };

function extractPropertyStats(text: string): PropertyStat[] {
  const stats: PropertyStat[] = [];
  const price = text.match(/\$[\d,]+(?:\.\d+)?(?:\s*[KkMm])?/);
  if (price) stats.push({ label: "Price", value: price[0] });

  const beds = text.match(/(\d+)\s*(?:bed(?:rooms?)?|br|bd)\b/i);
  if (beds) stats.push({ label: "Beds", value: beds[1] });

  const baths = text.match(/(\d+(?:\.\d+)?)\s*(?:bath(?:rooms?)?|ba)\b/i);
  if (baths) stats.push({ label: "Baths", value: baths[1] });

  const sqft = text.match(/([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft|sf)\b/i);
  if (sqft) stats.push({ label: "Sq ft", value: sqft[1] });

  const score = text.match(/(?:score|overall)[:\s]*(\d+(?:\.\d+)?\s*\/\s*10)/i);
  if (score) stats.push({ label: "Score", value: score[1].replace(/\s+/g, "") });

  return stats.slice(0, 4);
}

function isPropertyHeading(text: string) {
  return (
    /property|listing|home|house|condo|recommendation|#\d+/i.test(text) ||
    /\$[\d,]+/.test(text)
  );
}

function plainTextFromNodes(nodes: InlineNode[]) {
  return nodes
    .map((node) => (typeof node === "string" ? node : node.text))
    .join("");
}

type SectionGroup =
  | { kind: "summary"; heading: string; blocks: MdBlock[] }
  | { kind: "property"; heading: string; blocks: MdBlock[]; stats: PropertyStat[] }
  | { kind: "default"; blocks: MdBlock[] };

function groupBlocks(blocks: MdBlock[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let current: SectionGroup | null = null;

  const flush = () => {
    if (current) groups.push(current);
    current = null;
  };

  for (const block of blocks) {
    if (block.type === "h1") {
      flush();
      groups.push({ kind: "default", blocks: [block] });
      continue;
    }

    if (block.type === "h2" || block.type === "h3") {
      flush();
      const heading = block.text;
      if (/executive summary|summary/i.test(heading)) {
        current = { kind: "summary", heading, blocks: [block] };
      } else if (isPropertyHeading(heading)) {
        current = {
          kind: "property",
          heading,
          blocks: [block],
          stats: [],
        };
      } else {
        current = { kind: "default", blocks: [block] };
      }
      continue;
    }

    if (!current) {
      current = { kind: "default", blocks: [] };
    }
    current.blocks.push(block);

    if (current.kind === "property") {
      const text = current.blocks
        .map((item) => {
          if (item.type === "paragraph" || item.type === "blockquote") {
            return plainTextFromNodes(item.nodes);
          }
          if (item.type === "ul" || item.type === "ol") {
            return item.items.map(plainTextFromNodes).join(" ");
          }
          if (item.type === "h1" || item.type === "h2" || item.type === "h3") {
            return item.text;
          }
          return "";
        })
        .join(" ");
      current.stats = extractPropertyStats(text);
    }
  }

  flush();
  return groups;
}

function BlockList({ blocks, skipFirstHeading = false }: { blocks: MdBlock[]; skipFirstHeading?: boolean }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (skipFirstHeading && index === 0 && (block.type === "h2" || block.type === "h3")) {
          return null;
        }

        if (block.type === "h1") {
          return (
            <h2
              key={index}
              className="text-2xl font-semibold tracking-tight text-white"
            >
              {block.text}
            </h2>
          );
        }
        if (block.type === "h2") {
          return (
            <h3
              key={index}
              className="mt-6 text-lg font-semibold tracking-tight text-zinc-50 first:mt-0"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "h3") {
          return (
            <h4
              key={index}
              className="mt-4 text-base font-semibold text-zinc-100 first:mt-0"
            >
              {block.text}
            </h4>
          );
        }
        if (block.type === "hr") {
          return <hr key={index} className="my-5 border-white/10" />;
        }
        if (block.type === "paragraph") {
          return (
            <p key={index} className="mt-3 text-sm leading-7 text-zinc-300 first:mt-0">
              {renderInline(block.nodes, `p-${index}`)}
            </p>
          );
        }
        if (block.type === "blockquote") {
          return (
            <blockquote
              key={index}
              className="mt-3 border-l-2 border-emerald-500/40 pl-3 text-sm leading-7 text-zinc-300"
            >
              {renderInline(block.nodes, `q-${index}`)}
            </blockquote>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-zinc-300">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `ul-${index}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index} className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-zinc-300">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `ol-${index}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "table") {
          return (
            <div key={index} className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-white/5 text-zinc-200">
                  <tr>
                    {block.headers.map((header) => (
                      <th
                        key={header}
                        className="border-b border-white/10 px-3 py-2 font-semibold"
                      >
                        {header.replace(/\*\*/g, "")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-white/5 last:border-0">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-zinc-300">
                          {cell.replace(/\*\*/g, "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </>
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
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const title = useMemo(() => extractTitle(content), [content]);
  const blocks = useMemo(() => parseReportMarkdown(content), [content]);
  const groups = useMemo(() => groupBlocks(blocks), [blocks]);
  const actionsDisabled = isStreaming || !content.trim();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1800);
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
  }

  function handleEmail() {
    const to = emailRecipient?.trim() || "";
    const body = content.length > 1800 ? `${content.slice(0, 1800)}\n\n…(truncated)` : content;
    const href = `mailto:${to}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-zinc-950/60 shadow-lg shadow-black/20">
      <header className="flex flex-col gap-3 border-b border-white/10 bg-emerald-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Final report
          </p>
          <h2 className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
            {title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy"}
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={handleEmail}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Email
          </button>
        </div>
      </header>

      <div className="space-y-4 px-4 py-5 sm:px-5">
        {groups.map((group, groupIndex) => {
          if (group.kind === "summary") {
            return (
              <section
                key={groupIndex}
                className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
                  Summary
                </p>
                <div className="mt-2">
                  <BlockList blocks={group.blocks} skipFirstHeading />
                </div>
              </section>
            );
          }

          if (group.kind === "property") {
            return (
              <section
                key={groupIndex}
                className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-base font-semibold text-white">
                    {group.heading}
                  </h3>
                  {group.stats.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {group.stats.map((stat) => (
                        <div
                          key={`${stat.label}-${stat.value}`}
                          className="rounded-xl border border-white/10 bg-zinc-900/80 px-2.5 py-1.5"
                        >
                          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                            {stat.label}
                          </p>
                          <p className="text-sm font-semibold text-emerald-200">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="mt-2">
                  <BlockList blocks={group.blocks} skipFirstHeading />
                </div>
              </section>
            );
          }

          return (
            <section key={groupIndex}>
              <BlockList blocks={group.blocks} />
            </section>
          );
        })}

        {isStreaming ? (
          <p className="text-sm text-zinc-400">
            Writing report
            <TypingDots />
          </p>
        ) : null}
      </div>
    </article>
  );
}
