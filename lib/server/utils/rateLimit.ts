type RateBucket = { count: number; resetAt: number };

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 8;

const globalStore = globalThis as typeof globalThis & {
  __chatAiRateLimitBuckets?: Map<string, RateBucket>;
};

const buckets =
  globalStore.__chatAiRateLimitBuckets ?? new Map<string, RateBucket>();
globalStore.__chatAiRateLimitBuckets = buckets;

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "anonymous";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "anonymous"
  );
}

/**
 * In-memory rate limiter matching the Express agentLimiter (8 req / 60s).
 * Note: on Vercel each serverless instance has its own memory, so limits are
 * best-effort rather than globally exact.
 */
export function enforceAgentRateLimit(request: Request): Response | null {
  const key = getClientKey(request);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  existing.count += 1;

  if (existing.count > MAX_REQUESTS) {
    return Response.json(
      {
        type: "error",
        message: "You are sending messages too quickly. Please wait a moment.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((existing.resetAt - now) / 1000)),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  return null;
}
