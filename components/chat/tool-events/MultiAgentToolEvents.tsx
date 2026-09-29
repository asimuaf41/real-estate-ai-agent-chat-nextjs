import type { ToolEvent } from "@/lib/chat/types";
import { MULTI_AGENT_PIPELINE } from "../AgentPipeline";

const AGENT_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    MULTI_AGENT_PIPELINE.map((agent) => [agent.id, agent.name]),
  ),
  communication_agent: "Email",
};

function agentLabel(tool: string) {
  return AGENT_LABELS[tool] ?? tool;
}

function summarizeInput(tool: string, input?: Record<string, unknown>) {
  if (!input) return "Started";
  if (tool === "orchestrator" && input.request) {
    return `Planning: ${String(input.request).slice(0, 90)}`;
  }
  if (input.query) return `Query: ${String(input.query).slice(0, 90)}`;
  if (input.criteria) return `Criteria: ${String(input.criteria).slice(0, 90)}`;
  if (input.topic) return `Writing: ${String(input.topic).slice(0, 90)}`;
  if (input.recipient) return `Emailing ${String(input.recipient)}`;
  if (input.userId) return "Loading client preferences";
  return "Started";
}

function summarizeResult(tool: string, result: Record<string, unknown>) {
  if (tool === "orchestrator" && result.plan) {
    const plan = result.plan as Record<string, unknown>;
    return `Plan ready${plan.report_topic ? ` · ${String(plan.report_topic).slice(0, 70)}` : ""}`;
  }
  if (typeof result.memoryCount === "number") {
    return `${result.memoryCount} memory match${result.memoryCount === 1 ? "" : "es"}`;
  }
  if (typeof result.matchCount === "number") {
    return `${result.matchCount} property chunk${result.matchCount === 1 ? "" : "s"} retrieved`;
  }
  if (result.summary) {
    return String(result.summary).slice(0, 120);
  }
  if (result.savedTo) {
    return `Saved · ${String(result.savedTo)}`;
  }
  if (result.message) {
    return String(result.message);
  }
  return "Finished";
}

function PlanDetails({ plan }: { plan: Record<string, unknown> }) {
  const rows: Array<[string, unknown]> = [
    ["Research", plan.research_query],
    ["Database", plan.database_query],
    ["Criteria", plan.analysis_criteria],
    ["Report", plan.report_topic],
    ["Recipient", plan.recipient],
  ];

  return (
    <dl className="mt-1.5 space-y-1 border-t border-border pt-1.5">
      {rows
        .filter(([, value]) => value)
        .map(([key, value]) => (
          <div key={key} className="flex gap-2 text-[11px]">
            <dt className="shrink-0 text-subtle">{key}</dt>
            <dd className="text-muted">{String(value)}</dd>
          </div>
        ))}
    </dl>
  );
}

export function MultiAgentToolEvents({ events }: { events: ToolEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">
        Activity log
      </p>
      <ul className="space-y-1.5">
        {events.map((event, index) => {
          if (event.type === "tool_use") {
            return (
              <li
                key={`use-${index}`}
                className="flex items-start gap-2 rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 px-3 py-2 text-xs"
              >
                <span className="mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-emerald" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {agentLabel(event.tool)}
                  </p>
                  <p className="mt-0.5 leading-5 text-muted">
                    {summarizeInput(event.tool, event.input)}
                  </p>
                </div>
              </li>
            );
          }

          if (!event.result) return null;

          return (
            <li
              key={`result-${index}`}
              className="rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">
                  {agentLabel(event.tool)}
                </p>
                <span className="text-[10px] uppercase tracking-[0.14em] text-success">
                  Done
                </span>
              </div>
              <p className="mt-1 leading-5 text-muted">
                {summarizeResult(event.tool, event.result)}
              </p>
              {event.tool === "orchestrator" && event.result.plan ? (
                <PlanDetails
                  plan={event.result.plan as Record<string, unknown>}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
