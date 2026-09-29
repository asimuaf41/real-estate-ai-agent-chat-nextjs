import { multiAgentAssistant } from "@/config/assistants";
import { accentClasses } from "@/lib/ui/accent";
import { cn } from "@/lib/ui/cn";
import { AgentPipeline } from "./AgentPipeline";

type MultiAgentEmptyStateProps = {
  onPromptSelect: (prompt: string) => void;
};

export function MultiAgentEmptyState({
  onPromptSelect,
}: MultiAgentEmptyStateProps) {
  const cards = multiAgentAssistant.promptCards ?? [];
  const accent = accentClasses.emerald;

  return (
    <section className="flex min-h-full flex-col py-2">
      <div className="my-auto w-full space-y-8">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            Agent desk
          </p>
          <h2
            className="mt-3 font-semibold tracking-tight text-foreground"
            style={{ fontSize: "var(--text-page)" }}
          >
            One request. Six agents. One report.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Pick an example below, or describe the brief you need.
          </p>
        </div>

        <AgentPipeline />

        <div>
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Try an example
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => onPromptSelect(card.prompt)}
                className={cn(
                  "focus-ring rounded-xl border border-border bg-surface px-4 py-4 text-left shadow-sm transition duration-(--duration-fast) hover:-translate-y-0.5",
                  accent.soft,
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
        </div>
      </div>
    </section>
  );
}
