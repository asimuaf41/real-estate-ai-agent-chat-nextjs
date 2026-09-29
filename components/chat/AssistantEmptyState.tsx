"use client";

import type { ReactNode } from "react";
import type { AccentId, PromptCard } from "@/lib/chat/types";
import { accentClasses } from "@/lib/ui/accent";
import { cn } from "@/lib/ui/cn";
import { EmptyState } from "@/components/ui/EmptyState";

type AssistantEmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent: AccentId;
  promptCards: PromptCard[];
  onPromptSelect: (prompt: string) => void;
  extra?: ReactNode;
};

export function AssistantEmptyState({
  eyebrow,
  title,
  description,
  accent,
  promptCards,
  onPromptSelect,
  extra,
}: AssistantEmptyStateProps) {
  const accentStyle = accentClasses[accent];

  return (
    <EmptyState eyebrow={eyebrow} title={title} description={description}>
      {extra}
      <div className={cn("grid gap-3", extra ? "mt-6" : "", "sm:grid-cols-2")}>
        {promptCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => onPromptSelect(card.prompt)}
            className={cn(
              "focus-ring rounded-xl border border-border bg-surface px-4 py-4 text-left shadow-sm transition duration-(--duration-fast) hover:-translate-y-0.5",
              accentStyle.soft,
            )}
          >
            <span className="block text-sm font-medium text-foreground">
              {card.title}
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              {card.detail}
            </span>
          </button>
        ))}
      </div>
    </EmptyState>
  );
}
