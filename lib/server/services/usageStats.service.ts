import { requireSupabase } from "@/lib/server/config/supabase.js";
import type {
  AgentUsageBreakdown,
  DailyUsagePoint,
  UsageLogEntry,
  UsageStats,
  UsageStatsQuery,
  UserUsageRow,
} from "@/lib/chat/usage-types";
import {
  DEFAULT_USAGE_STATS_QUERY,
  USAGE_RANGE_LABELS,
} from "@/lib/chat/usage-types";
import { calculateCost } from "@/lib/costs";
import { isOverSpendCap } from "@/lib/spendCap";
import { ANONYMOUS_USER_ID } from "@/lib/server/utils/request";
import type { SupabaseClient } from "@supabase/supabase-js";

export type {
  AgentUsageBreakdown,
  DailyUsagePoint,
  UsageLogEntry,
  UsageStats,
  UsageStatsQuery,
} from "@/lib/chat/usage-types";

const LOG_COLUMNS =
  "id, user_id, agent_type, model, input_tokens, output_tokens, total_tokens, cost_usd, duration_ms, success, error_message, created_at";

export type UsageLogRow = {
  id: string | number;
  user_id: string;
  agent_type: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  duration_ms: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "t" || normalized === "1";
  }
  return Boolean(value);
}

function roundUsd(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 1_000_000) / 1_000_000;
}

function logCost(log: UsageLogRow): number {
  const stored = toNumber(log.cost_usd);
  if (stored > 0) return roundUsd(stored);

  const inputTokens = toNumber(log.input_tokens);
  const outputTokens = toNumber(log.output_tokens);
  if (inputTokens > 0 || outputTokens > 0) {
    return roundUsd(calculateCost(log.model, inputTokens, outputTokens));
  }

  return 0;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toUsageLogEntry(row: UsageLogRow): UsageLogEntry {
  return {
    id: String(row.id),
    userId: row.user_id,
    agentType: row.agent_type,
    model: row.model,
    inputTokens: toNumber(row.input_tokens),
    outputTokens: toNumber(row.output_tokens),
    totalTokens: toNumber(row.total_tokens),
    costUsd: logCost(row),
    durationMs: toNumber(row.duration_ms),
    success: toBoolean(row.success),
    errorMessage: row.error_message ?? null,
    createdAt: row.created_at,
  };
}

function uniqueValues(logs: UsageLogRow[], key: "agent_type" | "model"): string[] {
  return [
    ...new Set(
      logs.map((log) => {
        const value = key === "agent_type" ? log.agent_type : log.model;
        return value || "unknown";
      }),
    ),
  ].sort();
}

function matchesFilters(log: UsageLogRow, query: UsageStatsQuery): boolean {
  const agentType = log.agent_type || "unknown";
  if (query.agents.length > 0 && !query.agents.includes(agentType)) {
    return false;
  }

  if (query.statuses.length === 1) {
    const succeeded = toBoolean(log.success);
    if (query.statuses[0] === "success" && !succeeded) return false;
    if (query.statuses[0] === "failed" && succeeded) return false;
  }

  if (query.models.length > 0 && !query.models.includes(log.model || "unknown")) {
    return false;
  }

  return true;
}

function rangeWindow(
  query: UsageStatsQuery,
  now: Date,
  logs: UsageLogRow[],
): { from: Date; to: Date } {
  const to = now;
  if (query.range === "today") {
    return { from: startOfUtcDay(now), to };
  }
  if (query.range === "7d") {
    return { from: addUtcDays(startOfUtcDay(now), -6), to };
  }
  if (query.range === "30d") {
    return { from: addUtcDays(startOfUtcDay(now), -29), to };
  }
  if (query.range === "month") {
    return { from: startOfUtcMonth(now), to };
  }

  const timestamps = logs
    .map((log) => new Date(log.created_at).getTime())
    .filter((value) => Number.isFinite(value));
  if (timestamps.length === 0) {
    return { from: startOfUtcDay(now), to };
  }
  return { from: startOfUtcDay(new Date(Math.min(...timestamps))), to };
}

function buildDailyTrend(
  logs: UsageLogRow[],
  from: Date,
  to: Date,
): DailyUsagePoint[] {
  const buckets = new Map<string, DailyUsagePoint>();
  const start = startOfUtcDay(from);
  const end = startOfUtcDay(to);

  for (
    let cursor = new Date(start.getTime());
    cursor.getTime() <= end.getTime();
    cursor = addUtcDays(cursor, 1)
  ) {
    const key = cursor.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: formatDayLabel(cursor),
      calls: 0,
      cost: 0,
      tokens: 0,
    });
  }

  for (const log of logs) {
    const key = new Date(log.created_at).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.calls += 1;
    bucket.cost = roundUsd(bucket.cost + logCost(log));
    bucket.tokens += toNumber(log.total_tokens);
  }

  return [...buckets.values()];
}

export function buildUsageStats(
  logs: UsageLogRow[],
  now = new Date(),
  query: UsageStatsQuery = DEFAULT_USAGE_STATS_QUERY,
): UsageStats {
  const availableAgents = uniqueValues(logs, "agent_type");
  const availableModels = uniqueValues(logs, "model");
  const scopedLogs = logs.filter((log) => matchesFilters(log, query));
  const window = rangeWindow(query, now, scopedLogs);
  const fromMs = window.from.getTime();
  const periodLogs = scopedLogs.filter(
    (log) => new Date(log.created_at).getTime() >= fromMs,
  );

  const todayStart = startOfUtcDay(now).getTime();
  const monthStart = startOfUtcMonth(now).getTime();
  const byAgent: Record<string, AgentUsageBreakdown> = {};

  let totalCost = 0;
  let totalTokens = 0;
  let todayCost = 0;
  let thisMonthCost = 0;
  let failedCalls = 0;
  let durationTotal = 0;
  let billableCalls = 0;

  // Today / this month are calendar windows, independent of the selected range.
  for (const log of scopedLogs) {
    const cost = logCost(log);
    const createdAt = new Date(log.created_at).getTime();
    if (createdAt >= todayStart) todayCost += cost;
    if (createdAt >= monthStart) thisMonthCost += cost;
  }

  for (const log of periodLogs) {
    const cost = logCost(log);
    const tokens =
      toNumber(log.total_tokens) ||
      toNumber(log.input_tokens) + toNumber(log.output_tokens);
    const agentType = log.agent_type || "unknown";
    const succeeded = toBoolean(log.success);

    totalCost += cost;
    totalTokens += tokens;
    durationTotal += toNumber(log.duration_ms);
    if (!succeeded) failedCalls += 1;
    if (cost > 0 || tokens > 0) billableCalls += 1;

    const bucket = byAgent[agentType] ?? {
      calls: 0,
      cost: 0,
      tokens: 0,
      failed: 0,
    };
    bucket.calls += 1;
    bucket.cost += cost;
    bucket.tokens += tokens;
    if (!succeeded) bucket.failed += 1;
    byAgent[agentType] = bucket;
  }

  for (const agentType of Object.keys(byAgent)) {
    byAgent[agentType].cost = roundUsd(byAgent[agentType].cost);
  }

  const totalCalls = periodLogs.length;

  return {
    totalCost: roundUsd(totalCost),
    totalTokens,
    totalCalls,
    todayCost: roundUsd(todayCost),
    thisMonthCost: roundUsd(thisMonthCost),
    failedCalls,
    successRate:
      totalCalls === 0 ? 100 : ((totalCalls - failedCalls) / totalCalls) * 100,
    avgDurationMs: totalCalls === 0 ? 0 : durationTotal / totalCalls,
    costPerCall: billableCalls === 0 ? 0 : roundUsd(totalCost / billableCalls),
    billableCalls,
    sourceCallCount: logs.length,
    allUsersCallCount: null,
    byAgent,
    last10: periodLogs.slice(0, 10).map(toUsageLogEntry),
    dailyTrend: buildDailyTrend(periodLogs, window.from, now),
    availableAgents,
    availableModels,
    query,
    rangeLabel: USAGE_RANGE_LABELS[query.range],
    rangeFrom: window.from.toISOString(),
    rangeTo: now.toISOString(),
    isOwner: false,
    userRows: null,
  };
}

async function fetchUsageLogs(
  supabase: SupabaseClient,
  userId?: string,
): Promise<UsageLogRow[]> {
  let query = supabase
    .from("usage_logs")
    .select(LOG_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as UsageLogRow[];
}

export async function getUsageStatsForUser(
  supabase: SupabaseClient,
  userId: string,
  query: UsageStatsQuery = DEFAULT_USAGE_STATS_QUERY,
): Promise<UsageStats> {
  return buildUsageStats(await fetchUsageLogs(supabase, userId), new Date(), query);
}

export async function getOwnerUsageStats(
  query: UsageStatsQuery = DEFAULT_USAGE_STATS_QUERY,
): Promise<UsageStats> {
  const supabase = requireSupabase();
  return buildUsageStats(await fetchUsageLogs(supabase), new Date(), query);
}

function userLabel(userId: string, email: string | null): string {
  if (userId === ANONYMOUS_USER_ID) return "Guest (shared)";
  if (email) return email.split("@")[0] || email;
  return `${userId.slice(0, 8)}…`;
}

async function loadUserEmails(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, string>> {
  const emails = new Map<string, string>();

  try {
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) {
        console.error("Could not list users for usage table:", error.message);
        break;
      }
      if (!data?.users?.length) break;
      for (const user of data.users) {
        if (user.id && user.email) {
          emails.set(user.id, user.email);
        }
      }
      if (data.users.length < 200) break;
    }
  } catch (error) {
    console.error("Could not load user emails for usage table:", error);
  }

  const missing = userIds.filter(
    (userId) => userId !== ANONYMOUS_USER_ID && !emails.has(userId),
  );

  await Promise.all(
    missing.map(async (userId) => {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(userId);
        if (!error && data.user?.email) {
          emails.set(userId, data.user.email);
        }
      } catch (error) {
        console.error(`Could not load email for ${userId}:`, error);
      }
    }),
  );

  return emails;
}

function buildUserRows(
  allLogs: UsageLogRow[],
  periodLogs: UsageLogRow[],
  emails: Map<string, string>,
): UserUsageRow[] {
  const lifetime = new Map<
    string,
    { cost: number; lastActiveAt: string | null }
  >();

  for (const log of allLogs) {
    const current = lifetime.get(log.user_id) ?? {
      cost: 0,
      lastActiveAt: null,
    };
    current.cost = roundUsd(current.cost + logCost(log));
    if (
      !current.lastActiveAt ||
      new Date(log.created_at).getTime() >
        new Date(current.lastActiveAt).getTime()
    ) {
      current.lastActiveAt = log.created_at;
    }
    lifetime.set(log.user_id, current);
  }

  const period = new Map<
    string,
    { calls: number; tokens: number; cost: number }
  >();
  for (const log of periodLogs) {
    const current = period.get(log.user_id) ?? {
      calls: 0,
      tokens: 0,
      cost: 0,
    };
    current.calls += 1;
    current.tokens +=
      toNumber(log.total_tokens) ||
      toNumber(log.input_tokens) + toNumber(log.output_tokens);
    current.cost = roundUsd(current.cost + logCost(log));
    period.set(log.user_id, current);
  }

  const userIds = new Set([...lifetime.keys(), ...period.keys()]);
  return [...userIds]
    .map((userId) => {
      const life = lifetime.get(userId) ?? { cost: 0, lastActiveAt: null };
      const slice = period.get(userId) ?? { calls: 0, tokens: 0, cost: 0 };
      const email = emails.get(userId) ?? null;
      return {
        userId,
        email,
        label: userLabel(userId, email),
        periodCalls: slice.calls,
        periodTokens: slice.tokens,
        periodCost: roundUsd(slice.cost),
        lifetimeCost: roundUsd(life.cost),
        limitReached: isOverSpendCap(life.cost),
        lastActiveAt: life.lastActiveAt,
      };
    })
    .sort((a, b) => b.lifetimeCost - a.lifetimeCost);
}

export async function getDashboardStats(options: {
  viewerId: string;
  isOwner: boolean;
  query: UsageStatsQuery;
}): Promise<UsageStats> {
  const { viewerId, isOwner } = options;
  const query: UsageStatsQuery = {
    ...options.query,
    scope: isOwner && options.query.scope === "all" ? "all" : "me",
  };
  const supabase = requireSupabase();
  let logs: UsageLogRow[];
  let allUsersCallCount: number | null = null;

  if (isOwner) {
    const allLogs = await fetchUsageLogs(supabase);
    allUsersCallCount = allLogs.length;
    logs =
      query.scope === "all"
        ? allLogs
        : allLogs.filter((log) => log.user_id === viewerId);
  } else {
    logs = await fetchUsageLogs(supabase, viewerId);
  }

  const stats = buildUsageStats(logs, new Date(), query);
  const window = rangeWindow(query, new Date(), logs);
  const fromMs = window.from.getTime();
  const periodLogs = logs.filter((log) => {
    if (!matchesFilters(log, query)) return false;
    return new Date(log.created_at).getTime() >= fromMs;
  });

  let userRows = null;
  if (isOwner && query.scope === "all") {
    const userIds = [
      ...new Set(
        [...logs, ...periodLogs].map((log) => log.user_id).filter(Boolean),
      ),
    ];
    userRows = buildUserRows(
      logs,
      periodLogs,
      await loadUserEmails(supabase, userIds),
    );
  }

  return {
    ...stats,
    isOwner,
    query,
    userRows,
    allUsersCallCount,
  };
}
