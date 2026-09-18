export type UsageLogEntry = {
  id: string;
  userId: string;
  agentType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  durationMs: number;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
};

export type AgentUsageBreakdown = {
  calls: number;
  cost: number;
  tokens: number;
  failed: number;
};

export type DailyUsagePoint = {
  date: string;
  label: string;
  calls: number;
  cost: number;
  tokens: number;
};

export const USAGE_RANGE_KEYS = ["today", "7d", "30d", "month", "all"] as const;
export type UsageRangeKey = (typeof USAGE_RANGE_KEYS)[number];

export const USAGE_RANGE_LABELS: Record<UsageRangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  all: "All time",
};

export type UsageCallStatus = "success" | "failed";

export type UsageScope = "all" | "me";

export type UsageStatsQuery = {
  range: UsageRangeKey;
  agents: string[];
  statuses: UsageCallStatus[];
  models: string[];
  scope: UsageScope;
};

export const DEFAULT_USAGE_STATS_QUERY: UsageStatsQuery = {
  range: "30d",
  agents: [],
  statuses: [],
  models: [],
  scope: "all",
};

export type UserUsageRow = {
  userId: string;
  email: string | null;
  label: string;
  periodCalls: number;
  periodTokens: number;
  periodCost: number;
  lifetimeCost: number;
  limitReached: boolean;
  lastActiveAt: string | null;
};

export type UsageStats = {
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  todayCost: number;
  thisMonthCost: number;
  failedCalls: number;
  successRate: number;
  avgDurationMs: number;
  costPerCall: number;
  byAgent: Record<string, AgentUsageBreakdown>;
  last10: UsageLogEntry[];
  dailyTrend: DailyUsagePoint[];
  availableAgents: string[];
  availableModels: string[];
  query: UsageStatsQuery;
  rangeLabel: string;
  rangeFrom: string;
  rangeTo: string;
  isOwner: boolean;
  userRows: UserUsageRow[] | null;
};

function firstParam(
  value: string | string[] | null | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function parseCsvList(
  value: string | string[] | null | undefined,
): string[] {
  const parts = Array.isArray(value) ? value : value ? [value] : [];
  const unique = new Set<string>();
  for (const part of parts) {
    for (const item of part.split(",")) {
      const trimmed = item.trim();
      if (trimmed) unique.add(trimmed);
    }
  }
  return [...unique];
}

export function parseUsageStatsQuery(params: {
  range?: string | string[] | null;
  agent?: string | string[] | null;
  agents?: string | string[] | null;
  status?: string | string[] | null;
  model?: string | string[] | null;
  models?: string | string[] | null;
  scope?: string | string[] | null;
}): UsageStatsQuery {
  const rangeRaw = firstParam(params.range);
  const range = USAGE_RANGE_KEYS.includes(rangeRaw as UsageRangeKey)
    ? (rangeRaw as UsageRangeKey)
    : DEFAULT_USAGE_STATS_QUERY.range;

  const agents = parseCsvList(params.agents ?? params.agent).filter(
    (agent) =>
      agent !== "all" && /^[a-z0-9-]{1,64}$/i.test(agent),
  );

  const statuses = parseCsvList(params.status).filter(
    (status): status is UsageCallStatus =>
      status === "success" || status === "failed",
  );

  const models = parseCsvList(params.models ?? params.model).filter(
    (model) =>
      model !== "all" && /^[a-z0-9._-]{1,80}$/i.test(model),
  );

  const scopeRaw = firstParam(params.scope);
  const scope: UsageScope = scopeRaw === "me" ? "me" : "all";

  return { range, agents, statuses, models, scope };
}

export function usageStatsSearchParams(query: UsageStatsQuery): string {
  const params = new URLSearchParams();
  if (query.range !== DEFAULT_USAGE_STATS_QUERY.range) {
    params.set("range", query.range);
  }
  if (query.agents.length > 0) {
    params.set("agent", query.agents.join(","));
  }
  if (query.statuses.length === 1) {
    params.set("status", query.statuses[0]);
  } else if (query.statuses.length > 1) {
    params.set("status", query.statuses.join(","));
  }
  if (query.models.length > 0) {
    params.set("model", query.models.join(","));
  }
  if (query.scope === "me") {
    params.set("scope", "me");
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}
