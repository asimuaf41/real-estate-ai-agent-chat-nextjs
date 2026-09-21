import { createClient } from "@supabase/supabase-js";
import { calculateCost } from "./costs";
import { logger } from "./logger";

export type AgentType = "weather" | "research" | "rag" | "multi-agent";

export interface LogUsageParams {
  userId: string;
  agentType: AgentType | string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
}

export type UsageLog = {
  id: string;
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

/**
 * Server-only service-role client for usage_logs inserts.
 * Never import this module from client components.
 */
function getAdminClient() {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Alert if daily cost > $1
const DAILY_ALERT_THRESHOLD = 1.0;

export async function getLifetimeSpendUsd(userId: string): Promise<number> {
  const supabase = getAdminClient();
  if (!supabase || !userId) return 0;

  let total = 0;
  let from = 0;
  const pageSize = 1000;

  while (from < 20_000) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("usage_logs")
      .select("cost_usd")
      .eq("user_id", userId)
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }
    if (!data?.length) break;

    total += data.reduce((sum, row) => sum + Number(row.cost_usd || 0), 0);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return Number.isFinite(total) ? total : 0;
}

async function checkAndAlert(userId: string) {
  try {
    const supabase = getAdminClient();
    if (!supabase) return;

    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const { data } = await supabase
      .from("usage_logs")
      .select("cost_usd")
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString());

    if (!data) return;

    const dailyTotal = data.reduce(
      (sum, row) => sum + Number(row.cost_usd),
      0,
    );

    if (dailyTotal > DAILY_ALERT_THRESHOLD) {
      // Log to console for now
      // In production: send email via SendGrid or Resend
      logger.warn("Daily cost threshold exceeded", {
        userId,
        dailyTotal,
        threshold: DAILY_ALERT_THRESHOLD,
      });
    }
  } catch (err) {
    logger.error("Cost alert check failed", { error: err });
  }
}

export async function logUsage(params: LogUsageParams): Promise<UsageLog | null> {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      logger.error("Usage log skipped: missing Supabase admin credentials");
      return null;
    }

    const totalTokens = params.inputTokens + params.outputTokens;
    const costUsd = calculateCost(
      params.model,
      params.inputTokens,
      params.outputTokens,
    );

    const { data, error } = await supabase
      .from("usage_logs")
      .insert({
        user_id: params.userId,
        agent_type: params.agentType,
        model: params.model,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        total_tokens: totalTokens,
        cost_usd: costUsd,
        duration_ms: params.durationMs,
        success: params.success,
        error_message: params.errorMessage || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Usage log insert failed", { error });
      return null;
    }

    await checkAndAlert(params.userId);

    return data as UsageLog;
  } catch (err) {
    // Never let logging break the agent
    logger.error("Usage logger failed", { error: err });
    return null;
  }
}
