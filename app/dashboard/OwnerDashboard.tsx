"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiEndpoints } from "@/lib/api";
import { formatCost } from "@/lib/costs";
import type {
  DailyUsagePoint,
  UsageCallStatus,
  UsageRangeKey,
  UsageScope,
  UsageStats,
  UsageStatsQuery,
} from "@/lib/chat/usage-types";
import {
  USAGE_RANGE_KEYS,
  USAGE_RANGE_LABELS,
  usageStatsSearchParams,
} from "@/lib/chat/usage-types";

const AGENT_LABELS: Record<string, string> = {
  weather: "Weather",
  research: "Research",
  rag: "Real Estate",
  "multi-agent": "Multi-Agent",
};

const AGENT_COLORS: Record<string, string> = {
  weather: "#a855f7",
  research: "#3b82f6",
  rag: "#22d3ee",
  "multi-agent": "#22c55e",
};

type FilterMenu = "range" | "agents" | "status" | "models" | "scope" | null;

type OwnerDashboardProps = {
  initialStats: UsageStats;
  viewerEmail: string;
  viewerName: string;
  isOwner: boolean;
};

function formatAgent(agentType: string) {
  return AGENT_LABELS[agentType] ?? agentType;
}

function formatModel(model: string) {
  return model.replace(/^claude-/, "");
}

function formatTokens(tokens: number) {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return tokens.toLocaleString();
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRangeBounds(from: string, to: string) {
  const start = new Date(from).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const end = new Date(to).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return start === end ? start : `${start} – ${end}`;
}

function sparkWindow(values: number[], size = 14) {
  return values.slice(-size);
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function InfoDot() {
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[9px] font-medium text-zinc-500"
      aria-hidden="true"
    >
      i
    </span>
  );
}

function Sparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const gradientId = useId();

  if (values.length < 2) {
    return <div className="h-10 w-[84px]" />;
  }

  const max = Math.max(...values, 0.0001);
  const width = 84;
  const height = 40;
  const coords = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - 5 - (value / max) * (height - 10);
    return { x, y };
  });
  const line = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const area = `${line} L${coords[coords.length - 1].x} ${height} L${coords[0].x} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-10 w-[84px]" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.42" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrendChart({ points }: { points: DailyUsagePoint[] }) {
  const callsFillId = useId();
  const costFillId = useId();
  const width = 980;
  const height = 268;
  const padding = { top: 18, right: 12, bottom: 38, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxCalls = Math.max(...points.map((point) => point.calls), 1);
  const maxCost = Math.max(...points.map((point) => point.cost), 0.001);

  function xFor(index: number) {
    if (points.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (points.length - 1)) * innerWidth;
  }

  function pathFor(values: number[], max: number) {
    return values
      .map((value, index) => {
        const x = xFor(index);
        const y = padding.top + innerHeight - (value / max) * innerHeight;
        return `${index === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");
  }

  const callValues = points.map((point) => point.calls);
  const costValues = points.map((point) => point.cost);
  const callPath = pathFor(callValues, maxCalls);
  const costPath = pathFor(costValues, maxCost);
  const firstX = xFor(0);
  const lastX = xFor(Math.max(points.length - 1, 0));
  const baseline = padding.top + innerHeight;
  const callArea = `${callPath} L${lastX} ${baseline} L${firstX} ${baseline} Z`;
  const costArea = `${costPath} L${lastX} ${baseline} L${firstX} ${baseline} Z`;
  const yTickValues = (() => {
    const max = Math.max(1, Math.ceil(maxCalls));
    if (max <= 6) {
      return Array.from({ length: max + 1 }, (_, index) => max - index);
    }
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, index) =>
      Math.round((max * (steps - index)) / steps),
    );
  })();
  const yMax = yTickValues[0] || 1;
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[268px] w-full" role="img">
      <defs>
        <linearGradient id={callsFillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={costFillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTickValues.map((value) => {
        const y = padding.top + innerHeight * (1 - value / yMax);
        return (
          <g key={`tick-${value}`}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fill="#6b7280"
              fontSize="11"
            >
              {value}
            </text>
          </g>
        );
      })}
      <path d={callArea} fill={`url(#${callsFillId})`} />
      <path d={costArea} fill={`url(#${costFillId})`} />
      <path d={callPath} fill="none" stroke="#3b82f6" strokeWidth="2.4" />
      <path d={costPath} fill="none" stroke="#22c55e" strokeWidth="2.4" />
      {points.map((point, index) =>
        index % labelEvery === 0 || index === points.length - 1 ? (
          <text
            key={point.date}
            x={xFor(index)}
            y={height - 12}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="11"
          >
            {point.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function MetricCard({
  label,
  value,
  hint,
  hintClassName = "text-zinc-500",
  spark,
  sparkColor,
}: {
  label: string;
  value: string;
  hint: string;
  hintClassName?: string;
  spark: number[];
  sparkColor: string;
}) {
  return (
    <article className="rounded-[18px] border border-white/[0.06] bg-[#101826] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-[32px] font-semibold leading-none tracking-tight text-white">
            {value}
          </p>
          <p className={`mt-2 text-xs ${hintClassName}`}>{hint}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 pt-0.5">
          <InfoDot />
          <Sparkline values={spark} color={sparkColor} />
        </div>
      </div>
    </article>
  );
}

function FilterDropdown({
  id,
  label,
  open,
  disabled,
  onToggle,
  children,
}: {
  id: FilterMenu;
  label: string;
  open: boolean;
  disabled?: boolean;
  onToggle: (id: FilterMenu) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative" data-filter-menu={id}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onToggle(open ? null : id)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-[#101826] px-3 py-1.5 text-xs text-zinc-200 transition hover:border-white/20 disabled:opacity-60"
      >
        <span className="max-w-[160px] truncate">{label}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 min-w-[220px] rounded-2xl border border-white/10 bg-[#0d1420] p-2 shadow-2xl shadow-black/40">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function CheckRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
    >
      <span
        className={[
          "flex h-4 w-4 items-center justify-center rounded border",
          checked
            ? "border-orange-400 bg-orange-500 text-white"
            : "border-white/20 bg-transparent",
        ].join(" ")}
      >
        {checked ? (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
            <path
              d="M3.5 8.2l2.8 2.8 6.2-6.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function OwnerDashboard({
  initialStats,
  viewerEmail,
  viewerName,
  isOwner,
}: OwnerDashboardProps) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<FilterMenu>(null);
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const query = stats.query;
  const busy = isLoading;

  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!filterBarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const callSpark = useMemo(
    () => sparkWindow(stats.dailyTrend.map((point) => point.calls)),
    [stats.dailyTrend],
  );
  const costSpark = useMemo(
    () => sparkWindow(stats.dailyTrend.map((point) => point.cost)),
    [stats.dailyTrend],
  );
  const tokenSpark = useMemo(
    () => sparkWindow(stats.dailyTrend.map((point) => point.tokens)),
    [stats.dailyTrend],
  );

  const agentEntries = useMemo(
    () => Object.entries(stats.byAgent).sort((a, b) => b[1].cost - a[1].cost),
    [stats.byAgent],
  );
  const totalAgentCalls = Math.max(
    agentEntries.reduce((sum, [, item]) => sum + item.calls, 0),
    1,
  );
  const agentOptions = useMemo(() => {
    const values = new Set(stats.availableAgents);
    for (const agent of query.agents) values.add(agent);
    return [...values].sort();
  }, [query.agents, stats.availableAgents]);
  const modelOptions = useMemo(() => {
    const values = new Set(stats.availableModels);
    for (const model of query.models) values.add(model);
    return [...values].sort();
  }, [query.models, stats.availableModels]);

  const hasCalls = stats.totalCalls > 0;
  const trendHasActivity = stats.dailyTrend.some(
    (point) => point.calls > 0 || point.cost > 0,
  );
  const showFailedCard =
    hasCalls &&
    stats.failedCalls > 0 &&
    query.statuses.join(",") !== "success";
  const showSuccessCard =
    hasCalls && query.statuses.join(",") !== "failed";
  const showAgentBreakdown = hasCalls && agentEntries.length > 1;
  const showRecent = stats.last10.length > 0;
  const failedOnly = query.statuses.length === 1 && query.statuses[0] === "failed";

  async function loadQuery(next: UsageStatsQuery, closeMenu: boolean) {
    const search = usageStatsSearchParams(next);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiEndpoints.usageStats}${search}`, {
        credentials: "same-origin",
      });
      if (response.status === 401) {
        router.replace("/login?next=/dashboard");
        return;
      }
      if (!response.ok) {
        throw new Error(`Could not load stats (${response.status})`);
      }
      setStats((await response.json()) as UsageStats);
      window.history.replaceState(null, "", `/dashboard${search}`);
      if (closeMenu) setOpenMenu(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load stats");
    } finally {
      setIsLoading(false);
    }
  }

  function applyQuery(next: Partial<UsageStatsQuery>, closeMenu = true) {
    void loadQuery({ ...query, ...next }, closeMenu);
  }

  const agentLabel =
    query.agents.length === 0
      ? "All agents"
      : query.agents.length === 1
        ? formatAgent(query.agents[0])
        : `${query.agents.length} agents`;
  const statusLabel =
    query.statuses.length === 1
      ? query.statuses[0] === "success"
        ? "Succeeded"
        : "Failed"
      : "All calls";
  const modelLabel =
    query.models.length === 0
      ? "All models"
      : query.models.length === 1
        ? formatModel(query.models[0])
        : `${query.models.length} models`;

  return (
    <div className="min-h-screen bg-[#070b12] text-zinc-100">
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-xs font-medium text-zinc-500 transition hover:text-zinc-200"
            >
              ← Back to workspace
            </Link>
            <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {isOwner && query.scope === "all"
                ? "All users’ agent usage and spend."
                : `Usage for ${viewerName}.`}
            </p>
          </div>
          <div ref={filterBarRef} className="flex flex-wrap items-center justify-end gap-2">
            {isOwner ? (
              <FilterDropdown
                id="scope"
                label={query.scope === "all" ? "All users" : "My usage"}
                open={openMenu === "scope"}
                disabled={busy}
                onToggle={setOpenMenu}
              >
                <CheckRow
                  checked={query.scope === "all"}
                  label="All users"
                  onToggle={() => applyQuery({ scope: "all" as UsageScope }, true)}
                />
                <CheckRow
                  checked={query.scope === "me"}
                  label="My usage"
                  onToggle={() => applyQuery({ scope: "me" as UsageScope }, true)}
                />
              </FilterDropdown>
            ) : null}
            <FilterDropdown
              id="range"
              label={USAGE_RANGE_LABELS[query.range]}
              open={openMenu === "range"}
              disabled={busy}
              onToggle={setOpenMenu}
            >
              {USAGE_RANGE_KEYS.map((range) => (
                <CheckRow
                  key={range}
                  checked={query.range === range}
                  label={USAGE_RANGE_LABELS[range]}
                  onToggle={() => applyQuery({ range: range as UsageRangeKey }, true)}
                />
              ))}
            </FilterDropdown>

            {agentOptions.length > 0 ? (
              <FilterDropdown
                id="agents"
                label={agentLabel}
                open={openMenu === "agents"}
                disabled={busy}
                onToggle={setOpenMenu}
              >
                <CheckRow
                  checked={query.agents.length === 0}
                  label="All agents"
                  onToggle={() => applyQuery({ agents: [] }, false)}
                />
                {agentOptions.map((agent) => (
                  <CheckRow
                    key={agent}
                    checked={query.agents.includes(agent)}
                    label={formatAgent(agent)}
                    onToggle={() =>
                      applyQuery({ agents: toggleValue(query.agents, agent) }, false)
                    }
                  />
                ))}
              </FilterDropdown>
            ) : null}

            <FilterDropdown
              id="status"
              label={statusLabel}
              open={openMenu === "status"}
              disabled={busy}
              onToggle={setOpenMenu}
            >
              <CheckRow
                checked={query.statuses.length === 0}
                label="All calls"
                onToggle={() => applyQuery({ statuses: [] }, false)}
              />
              {(["success", "failed"] as UsageCallStatus[]).map((status) => (
                <CheckRow
                  key={status}
                  checked={query.statuses.includes(status)}
                  label={status === "success" ? "Succeeded" : "Failed"}
                  onToggle={() =>
                    applyQuery(
                      { statuses: toggleValue(query.statuses, status) },
                      false,
                    )
                  }
                />
              ))}
            </FilterDropdown>

            {modelOptions.length > 0 ? (
              <FilterDropdown
                id="models"
                label={modelLabel}
                open={openMenu === "models"}
                disabled={busy}
                onToggle={setOpenMenu}
              >
                <CheckRow
                  checked={query.models.length === 0}
                  label="All models"
                  onToggle={() => applyQuery({ models: [] }, false)}
                />
                {modelOptions.map((model) => (
                  <CheckRow
                    key={model}
                    checked={query.models.includes(model)}
                    label={formatModel(model)}
                    onToggle={() =>
                      applyQuery({ models: toggleValue(query.models, model) }, false)
                    }
                  />
                ))}
              </FilterDropdown>
            ) : null}

            <button
              type="button"
              onClick={() => void loadQuery(query, true)}
              disabled={busy}
              className="rounded-full border border-white/10 bg-[#101826] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-orange-400/40 hover:text-white disabled:opacity-60"
            >
              {busy ? "Updating..." : "Refresh"}
            </button>
          </div>
        </header>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-rose-400">
            {error}
          </p>
        ) : null}

        <p className="mt-3 text-xs text-zinc-500">
          {stats.rangeLabel}
          {query.agents.length > 0
            ? ` · ${query.agents.map(formatAgent).join(", ")}`
            : " · all agents"}
          {query.statuses.length === 1 ? ` · ${statusLabel.toLowerCase()}` : ""}
          {query.models.length > 0
            ? ` · ${query.models.map(formatModel).join(", ")}`
            : ""}{" "}
          · {formatRangeBounds(stats.rangeFrom, stats.rangeTo)} · {viewerEmail}
        </p>

        <div className={busy ? "pointer-events-none opacity-60" : ""}>
          {!hasCalls ? (
            <section className="mt-8 rounded-[18px] border border-white/[0.06] bg-[#101826] px-6 py-16 text-center">
              <h2 className="text-lg font-medium text-white">No matching usage</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Nothing is logged for these filters yet. Run an agent or widen the
                selection.
              </p>
            </section>
          ) : (
            <>
              <section className="mt-8">
                <h2 className="text-[17px] font-medium text-white">
                  Core usage &amp; cost metrics
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label={`${stats.rangeLabel} cost`}
                    value={formatCost(stats.totalCost)}
                    hint={formatRangeBounds(stats.rangeFrom, stats.rangeTo)}
                    spark={costSpark}
                    sparkColor="#22c55e"
                  />
                  <MetricCard
                    label="API calls"
                    value={stats.totalCalls.toLocaleString()}
                    hint={`${formatCost(stats.costPerCall)} average / call`}
                    spark={callSpark}
                    sparkColor="#3b82f6"
                  />
                  {stats.totalTokens > 0 ? (
                    <MetricCard
                      label="Tokens used"
                      value={formatTokens(stats.totalTokens)}
                      hint="Input + output in this range"
                      spark={tokenSpark}
                      sparkColor="#a855f7"
                    />
                  ) : null}
                  {stats.avgDurationMs > 0 ? (
                    <MetricCard
                      label="Avg duration"
                      value={formatDuration(stats.avgDurationMs)}
                      hint="Mean time per matching call"
                      spark={callSpark}
                      sparkColor="#38bdf8"
                    />
                  ) : null}
                </div>
              </section>

              {showSuccessCard || showFailedCard ? (
                <section className="mt-8">
                  <h2 className="text-[17px] font-medium text-white">
                    AI agent performance
                  </h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {showSuccessCard ? (
                      <MetricCard
                        label="Success rate"
                        value={`${Math.round(stats.successRate)}%`}
                        hint={`${stats.totalCalls - stats.failedCalls} of ${stats.totalCalls} resolved`}
                        hintClassName="text-emerald-400"
                        spark={callSpark}
                        sparkColor="#22c55e"
                      />
                    ) : null}
                    {showFailedCard ? (
                      <MetricCard
                        label="Failed calls"
                        value={String(stats.failedCalls)}
                        hint={
                          failedOnly
                            ? "Only failed runs are selected"
                            : "Unsuccessful agent runs"
                        }
                        hintClassName="text-orange-400"
                        spark={callSpark}
                        sparkColor="#f43f5e"
                      />
                    ) : null}
                  </div>
                </section>
              ) : null}

              {trendHasActivity ? (
                <section className="mt-8 rounded-[18px] border border-white/[0.06] bg-[#101826] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-medium text-white">
                        Calls &amp; spend trend
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        Daily volume for {stats.rangeLabel.toLowerCase()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" /> Calls
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Cost
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <TrendChart points={stats.dailyTrend} />
                  </div>
                </section>
              ) : null}

              {showAgentBreakdown ? (
                <section className="mt-4 grid gap-4 lg:grid-cols-2">
                  <article className="rounded-[18px] border border-white/[0.06] bg-[#101826] p-5">
                    <h2 className="text-lg font-medium text-white">Cost by agent</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Click an assistant to add or remove it from the filter
                    </p>
                    <ul className="mt-5 divide-y divide-white/[0.06]">
                      {agentEntries.map(([agent, item]) => (
                        <li
                          key={agent}
                          className="flex items-center justify-between gap-3 py-3 first:pt-0"
                        >
                          <button
                            type="button"
                            className="text-left text-sm font-medium text-zinc-200 hover:text-white"
                            onClick={() =>
                              applyQuery({
                                agents: toggleValue(query.agents, agent),
                              })
                            }
                          >
                            {formatAgent(agent)}
                          </button>
                          <span className="text-sm text-zinc-400">
                            {item.calls} · {formatCost(item.cost)}
                            {item.failed ? ` · ${item.failed} failed` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="rounded-[18px] border border-white/[0.06] bg-[#101826] p-5">
                    <h2 className="text-lg font-medium text-white">Agent mix</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Share of API calls in this range
                    </p>
                    <div className="mt-5 space-y-4">
                      {agentEntries.map(([agent, item]) => {
                        const share = (item.calls / totalAgentCalls) * 100;
                        return (
                          <button
                            key={agent}
                            type="button"
                            className="block w-full text-left"
                            onClick={() =>
                              applyQuery({
                                agents: toggleValue(query.agents, agent),
                              })
                            }
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-zinc-200">
                                {formatAgent(agent)}
                              </span>
                              <span className="text-zinc-400">
                                {share.toFixed(0)}% · {formatCost(item.cost)}
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(6, share)}%`,
                                  background: AGENT_COLORS[agent] ?? "#ff7a1a",
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                </section>
              ) : null}

              {showRecent ? (
                <section className="mt-4 rounded-[18px] border border-white/[0.06] bg-[#101826] p-5">
                  <h2 className="text-lg font-medium text-white">Recent activity</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Latest {stats.last10.length} matching calls
                  </p>
                  <ul className="mt-4 divide-y divide-white/[0.06]">
                    {stats.last10.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">
                            {formatAgent(entry.agentType)}
                            {entry.success ? "" : " · failed"}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {formatTimestamp(entry.createdAt)} · {entry.model}
                            {entry.errorMessage ? ` · ${entry.errorMessage}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm text-white">
                            {formatCost(entry.costUsd)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {formatTokens(entry.totalTokens)} tok ·{" "}
                            {formatDuration(entry.durationMs)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}

          {isOwner && stats.userRows && stats.userRows.length > 0 ? (
            <section className="mt-4 overflow-hidden rounded-[18px] border border-white/[0.06] bg-[#101826]">
              <div className="px-5 pt-5">
                <h2 className="text-lg font-medium text-white">All user usage</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Activity in the selected range, plus each account’s overall usage
                </p>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-y border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">User</th>
                      <th className="px-3 py-3 font-medium">Range calls</th>
                      <th className="px-3 py-3 font-medium">Range cost</th>
                      <th className="px-3 py-3 font-medium">Lifetime</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Last active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {stats.userRows.map((row) => (
                      <tr key={row.userId} className="text-zinc-200">
                        <td className="px-5 py-3">
                          <p className="font-medium text-white">
                            {row.userId === "anonymous"
                              ? "Guest (shared)"
                              : row.email ?? "Email unavailable"}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-mono text-[11px] text-zinc-400">
                            {row.userId === "anonymous"
                              ? "anonymous"
                              : row.userId.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-3 py-3">{row.periodCalls}</td>
                        <td className="px-3 py-3">{formatCost(row.periodCost)}</td>
                        <td className="px-3 py-3">{formatCost(row.lifetimeCost)}</td>
                        <td
                          className={`px-3 py-3 ${
                            row.limitReached ? "text-rose-300" : "text-emerald-300"
                          }`}
                        >
                          {row.limitReached ? "Limit reached" : "Available"}
                        </td>
                        <td className="px-5 py-3 text-zinc-400">
                          {row.lastActiveAt
                            ? formatTimestamp(row.lastActiveAt)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
