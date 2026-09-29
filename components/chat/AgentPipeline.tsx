"use client";

import type { ReactNode } from "react";
import type { ToolEvent } from "@/lib/chat/types";

export type AgentStatus = "idle" | "waiting" | "working" | "done";

export type AgentDefinition = {
  id: string;
  name: string;
  role: string;
  icon: ReactNode;
};

const iconClass = "h-4 w-4";

function OrchestratorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PreferencesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19.2c1.6-3 4-4.5 7-4.5s5.4 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path
        d="M4 19h16M7 16V9M12 16V5M17 16v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WriterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path
        d="M5 20h14M7.5 15.5 16 7l2.5 2.5-8.5 8.5H7.5v-2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const MULTI_AGENT_PIPELINE: AgentDefinition[] = [
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Plans the job and delegates to specialists",
    icon: <OrchestratorIcon />,
  },
  {
    id: "preference_agent",
    name: "Preferences",
    role: "Recalls client needs and past context",
    icon: <PreferencesIcon />,
  },
  {
    id: "research_agent",
    name: "Web Research",
    role: "Gathers live market signals from the web",
    icon: <ResearchIcon />,
  },
  {
    id: "database_agent",
    name: "Property Database",
    role: "Retrieves matching listings from your data",
    icon: <DatabaseIcon />,
  },
  {
    id: "analysis_agent",
    name: "Analysis",
    role: "Compares options against criteria",
    icon: <AnalysisIcon />,
  },
  {
    id: "writer_agent",
    name: "Report Writer",
    role: "Drafts the client-ready brief",
    icon: <WriterIcon />,
  },
];

export const PROMPT_ICONS = [
  <ResearchIcon key="r" />,
  <PreferencesIcon key="p" />,
  <AnalysisIcon key="a" />,
  <WriterIcon key="w" />,
];

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "Idle",
  waiting: "Waiting",
  working: "Working",
  done: "Done",
};

export function deriveAgentStatuses(
  events: ToolEvent[] | undefined,
  isStreaming: boolean,
): Record<string, AgentStatus> {
  const statuses: Record<string, AgentStatus> = {};

  for (const agent of MULTI_AGENT_PIPELINE) {
    const hasResult = Boolean(
      events?.some(
        (event) => event.tool === agent.id && event.type === "tool_result",
      ),
    );
    const hasUse = Boolean(
      events?.some(
        (event) => event.tool === agent.id && event.type === "tool_use",
      ),
    );

    if (hasResult) {
      statuses[agent.id] = "done";
    } else if (hasUse) {
      statuses[agent.id] = "working";
    } else if (isStreaming) {
      statuses[agent.id] = "waiting";
    } else if (events && events.length > 0) {
      // Run finished without this agent (rare) — treat as waiting skipped / idle.
      statuses[agent.id] = "idle";
    } else {
      statuses[agent.id] = "idle";
    }
  }

  return statuses;
}

function pipelinePhaseLabel(
  statuses: Record<string, AgentStatus>,
  isLive: boolean,
) {
  if (!isLive && Object.values(statuses).every((s) => s === "idle")) {
    return "Idle";
  }
  if (Object.values(statuses).some((s) => s === "working")) {
    return "Running";
  }
  if (
    MULTI_AGENT_PIPELINE.every((agent) => statuses[agent.id] === "done") ||
    (!isLive && Object.values(statuses).some((s) => s === "done"))
  ) {
    return "Complete";
  }
  if (isLive) return "Starting";
  return "Idle";
}

type AgentPipelineProps = {
  statuses?: Record<string, AgentStatus>;
  isLive?: boolean;
  compact?: boolean;
};

export function AgentPipeline({
  statuses,
  isLive = false,
  compact = false,
}: AgentPipelineProps) {
  const resolved = statuses ?? Object.fromEntries(
    MULTI_AGENT_PIPELINE.map((agent) => [agent.id, "idle" as AgentStatus]),
  );
  const phase = pipelinePhaseLabel(resolved, isLive);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-zinc-200">
          Orchestration pipeline
        </h3>
        <p
          className={[
            "text-[11px] uppercase tracking-[0.18em]",
            phase === "Running"
              ? "text-emerald-300"
              : phase === "Complete"
                ? "text-emerald-400/80"
                : "text-zinc-500",
          ].join(" ")}
        >
          {phase}
        </p>
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {MULTI_AGENT_PIPELINE.map((agent, index) => {
          const status = resolved[agent.id] ?? "idle";
          const isWorking = status === "working";
          const isDone = status === "done";
          const isWaiting = status === "waiting";

          return (
            <li key={agent.id} className="relative">
              {index < MULTI_AGENT_PIPELINE.length - 1 ? (
                <span
                  className={[
                    "pointer-events-none absolute top-7 -right-1.5 z-10 hidden h-px w-3 xl:block",
                    isDone ? "bg-emerald-400/50" : "bg-emerald-500/20",
                  ].join(" ")}
                  aria-hidden="true"
                />
              ) : null}
              <div
                className={[
                  "h-full rounded-2xl border px-3 py-3 transition duration-300",
                  isWorking
                    ? "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
                    : isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : isWaiting
                        ? "border-white/10 bg-black/20 opacity-80"
                        : "border-white/10 bg-black/30",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-xl border transition duration-300",
                      isWorking
                        ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                        : isDone
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
                    ].join(" ")}
                  >
                    {agent.icon}
                  </span>
                  <span
                    className={[
                      "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                      isWorking
                        ? "text-emerald-300"
                        : isDone
                          ? "text-emerald-400/80"
                          : "text-zinc-500",
                    ].join(" ")}
                  >
                    {isWorking ? (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                    ) : null}
                    {STATUS_LABEL[status]}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-100">
                  {agent.name}
                </p>
                {!compact ? (
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {agent.role}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
