import type { ToolEvent } from "@/lib/chat/types";

const AGENT_META: Record<string, { label: string; emoji: string }> = {
  orchestrator: { label: "Orchestrator", emoji: "🎯" },
  preference_agent: { label: "User Preference Agent", emoji: "🧠" },
  research_agent: { label: "Research Agent", emoji: "🔬" },
  database_agent: { label: "Database Analyst", emoji: "🗄️" },
  analysis_agent: { label: "Analysis Agent", emoji: "📊" },
  writer_agent: { label: "Report Writer", emoji: "✍️" },
  communication_agent: { label: "Communication Lead", emoji: "📧" },
};

function agentLabel(tool: string) {
  return AGENT_META[tool]?.label ?? tool;
}

function agentEmoji(tool: string) {
  return AGENT_META[tool]?.emoji ?? "⚙️";
}

function PlanCard({ plan }: { plan: Record<string, unknown> }) {
  const rows: Array<[string, unknown]> = [
    ["Research", plan.research_query],
    ["Database", plan.database_query],
    ["Criteria", plan.analysis_criteria],
    ["Report", plan.report_topic],
    ["Recipient", plan.recipient],
  ];

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
      <p className="font-semibold text-emerald-50">🎯 Orchestrator plan</p>
      <dl className="mt-1.5 space-y-1">
        {rows
          .filter(([, value]) => value)
          .map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="shrink-0 text-emerald-300/80">{key}:</dt>
              <dd className="text-zinc-300">{String(value)}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

function ResultCard({ tool, result }: { tool: string; result: Record<string, unknown> }) {
  const sources = Array.isArray(result.sources) ? result.sources : [];
  const matches = Array.isArray(result.matches) ? result.matches : [];

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs">
      <p className="font-semibold text-zinc-100">
        {agentEmoji(tool)} {agentLabel(tool)}
      </p>

      {typeof result.memoryCount === "number" ? (
        <p className="mt-1 text-zinc-400">
          {result.memoryCount} memory match{result.memoryCount === 1 ? "" : "es"}
        </p>
      ) : null}

      {typeof result.matchCount === "number" ? (
        <p className="mt-1 text-zinc-400">
          {result.matchCount} property chunk{result.matchCount === 1 ? "" : "s"}{" "}
          retrieved
        </p>
      ) : null}

      {result.summary ? (
        <p className="mt-1 line-clamp-3 leading-5 text-zinc-300">
          {String(result.summary)}
        </p>
      ) : null}

      {sources.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5">
          {sources.slice(0, 3).map((source, index) => {
            const entry = source as Record<string, unknown>;
            return (
              <li key={index} className="truncate text-emerald-300/80">
                {String(entry.title ?? "Source")}
              </li>
            );
          })}
        </ul>
      ) : null}

      {matches.length > 0 ? (
        <p className="mt-1.5 text-zinc-500">
          Top match similarity:{" "}
          {Math.round(Number((matches[0] as Record<string, unknown>).similarity ?? 0) * 100)}
          %
        </p>
      ) : null}

      {result.savedTo ? (
        <p className="mt-1 text-zinc-500">Saved → {String(result.savedTo)}</p>
      ) : null}

      {tool === "communication_agent" && result.message ? (
        <p className="mt-1 text-emerald-300">{String(result.message)}</p>
      ) : null}
    </div>
  );
}

export function MultiAgentToolEvents({ events }: { events: ToolEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      {events.map((event, index) => {
        if (event.type === "tool_use") {
          return (
            <p
              key={`use-${index}`}
              className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-emerald-300/80"
            >
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {agentEmoji(event.tool)} {agentLabel(event.tool)} working...
            </p>
          );
        }

        if (event.tool === "orchestrator" && event.result?.plan) {
          return (
            <PlanCard
              key={`plan-${index}`}
              plan={event.result.plan as Record<string, unknown>}
            />
          );
        }

        if (event.result) {
          return (
            <ResultCard
              key={`result-${index}`}
              tool={event.tool}
              result={event.result}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
