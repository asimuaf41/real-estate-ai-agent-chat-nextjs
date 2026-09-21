// Anthropic pricing per 1 million tokens (as of 2025)
export const MODEL_COSTS = {
  "claude-sonnet-4-5": {
    input: 3.0, // $3 per 1M input tokens
    output: 15.0, // $15 per 1M output tokens
  },
  "claude-sonnet-4-5-20250929": {
    input: 3.0,
    output: 15.0,
  },
  "claude-haiku-3-5": {
    input: 0.8, // $0.80 per 1M input tokens
    output: 4.0, // $4 per 1M output tokens
  },
  "claude-haiku-4-5": {
    input: 1.0, // $1 per 1M input tokens
    output: 5.0, // $5 per 1M output tokens
  },
  "claude-haiku-4-5-20251001": {
    input: 1.0,
    output: 5.0,
  },
  "claude-opus-4": {
    input: 15.0, // $15 per 1M input tokens
    output: 75.0, // $75 per 1M output tokens
  },
} as const;

function resolvePricing(model: string) {
  if (model in MODEL_COSTS) {
    return MODEL_COSTS[model as keyof typeof MODEL_COSTS];
  }

  if (model.includes("haiku-4-5") || model.includes("haiku-4.5")) {
    return MODEL_COSTS["claude-haiku-4-5"];
  }
  if (model.includes("haiku")) {
    return MODEL_COSTS["claude-haiku-3-5"];
  }
  if (model.includes("opus")) {
    return MODEL_COSTS["claude-opus-4"];
  }

  return MODEL_COSTS["claude-sonnet-4-5"];
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = resolvePricing(model);

  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

// Format cost for display
export function formatCost(costUsd: number): string {
  const cost = Number(costUsd);
  if (!Number.isFinite(cost) || cost <= 0) return "$0";
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

// Calculate monthly projection from daily average
export function monthlyProjection(dailyCost: number): number {
  return dailyCost * 30;
}
