"use client";

import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type InlineNode = string | { type: "strong" | "em" | "code" | "link"; text: string; href?: string };

type MdBlock =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "paragraph"; nodes: InlineNode[] }
  | { type: "ul" | "ol"; items: InlineNode[][] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "blockquote"; nodes: InlineNode[] }
  | { type: "code"; language?: string; code: string };

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
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
    } else if (token.startsWith("`")) {
      nodes.push({ type: "code", text: token.slice(1, -1) });
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push({ type: "link", text: linkMatch[1], href: linkMatch[2] });
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length > 0 ? nodes : [text];
}

function renderInline(nodes: InlineNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof node === "string") return <span key={key}>{node}</span>;
    if (node.type === "strong") {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {node.text}
        </strong>
      );
    }
    if (node.type === "em") {
      return (
        <em key={key} className="italic text-muted">
          {node.text}
        </em>
      );
    }
    if (node.type === "link") {
      return (
        <a
          key={key}
          href={node.href}
          target="_blank"
          rel="noreferrer"
          className="text-brand underline underline-offset-2 hover:brightness-110"
        >
          {node.text}
        </a>
      );
    }
    return (
      <code
        key={key}
        className="rounded-md bg-surface-muted px-1 py-0.5 font-mono text-[0.85em] text-brand"
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

export function parseMarkdown(markdown: string): MdBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const trimmed = lines[index].trim();
    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || undefined;
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", language, code: codeLines.join("\n") });
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
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "blockquote", nodes: parseInline(quoteLines.join(" ")) });
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
      !lines[index].trim().startsWith("```") &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", nodes: parseInline(paragraphLines.join(" ")) });
  }

  return blocks;
}

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={cn("max-w-[72ch] space-y-3 text-sm leading-7 text-muted", className)}>
      {blocks.map((block, index) => {
        if (block.type === "h1") {
          return (
            <h2 key={index} className="text-xl font-semibold tracking-tight text-foreground">
              {block.text}
            </h2>
          );
        }
        if (block.type === "h2") {
          return (
            <h3 key={index} className="text-lg font-semibold tracking-tight text-foreground">
              {block.text}
            </h3>
          );
        }
        if (block.type === "h3") {
          return (
            <h4 key={index} className="text-base font-semibold text-foreground">
              {block.text}
            </h4>
          );
        }
        if (block.type === "hr") {
          return <hr key={index} className="border-border" />;
        }
        if (block.type === "paragraph") {
          return <p key={index}>{renderInline(block.nodes, `p-${index}`)}</p>;
        }
        if (block.type === "blockquote") {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-brand/40 pl-3 text-muted"
            >
              {renderInline(block.nodes, `q-${index}`)}
            </blockquote>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `ul-${index}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `ol-${index}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }
        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg border border-border bg-surface-muted p-3 font-mono text-xs text-foreground"
            >
              <code>{block.code}</code>
            </pre>
          );
        }
        if (block.type === "table") {
          return (
            <div key={index} className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-surface-muted text-foreground">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} className="border-b border-border px-3 py-2 font-semibold">
                        {header.replace(/\*\*/g, "")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border/60 last:border-0">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-muted">
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
    </div>
  );
}
