import { multiAgentAssistant } from "@/config/assistants";
import { AgentPipeline, PROMPT_ICONS } from "./AgentPipeline";

type MultiAgentEmptyStateProps = {
  onPromptSelect: (prompt: string) => void;
};

export function MultiAgentEmptyState({
  onPromptSelect,
}: MultiAgentEmptyStateProps) {
  const cards = multiAgentAssistant.promptCards ?? [];

  return (
    <section className="flex min-h-full flex-col py-1 sm:py-2">
      <div className="my-auto w-full space-y-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
            Agent desk
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            One request. Six agents. One report.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            The orchestrator coordinates five specialists in sequence and
            parallel — then returns a single client-ready brief.
          </p>
        </div>

        <AgentPipeline />

        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-200">
            Try an example
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card, index) => (
              <button
                key={card.title}
                type="button"
                onClick={() => onPromptSelect(card.prompt)}
                className="group rounded-2xl border border-white/10 bg-zinc-900/55 px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-emerald-500/5"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-emerald-300 transition group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                    {PROMPT_ICONS[index % PROMPT_ICONS.length]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">
                      {card.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500">
                      {card.detail}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
