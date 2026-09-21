import { logger } from "@/lib/logger";

export type RetryOptions = {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
};

export const DEFAULT_RETRYABLE_STATUS_CODES = [429, 500, 529] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    status_code?: unknown;
    response?: { status?: unknown };
  };

  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.statusCode === "number") return candidate.statusCode;
  if (typeof candidate.status_code === "number") return candidate.status_code;
  if (typeof candidate.response?.status === "number") {
    return candidate.response.status;
  }

  return undefined;
}

function isRetryable(error: unknown, retryableStatusCodes: number[]): boolean {
  const status = errorStatus(error);
  return typeof status === "number" && retryableStatusCodes.includes(status);
}

export async function withRetry<T>(
  fn: () => Promise<T> | T,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const delayMs = Math.max(0, options.delayMs ?? 1000);
  const backoffMultiplier = options.backoffMultiplier ?? 2;
  const retryableStatusCodes = options.retryableStatusCodes ?? [
    ...DEFAULT_RETRYABLE_STATUS_CODES,
  ];

  let delay = delayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const shouldRetry =
        attempt < maxAttempts && isRetryable(error, retryableStatusCodes);

      if (!shouldRetry) {
        throw error;
      }

      const status = errorStatus(error);
      logger.warn("Retrying failed request", {
        attempt,
        maxAttempts,
        status,
        delayMs: delay,
      });

      if (delay > 0) {
        await sleep(delay);
      }
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}
