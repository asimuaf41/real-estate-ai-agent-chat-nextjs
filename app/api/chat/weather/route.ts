import { selectModel } from "@/lib/modelSelector";
import { streamWeatherChat } from "@/lib/server/services/weather.service.js";
import { readJsonBody, resolveRequestUserId } from "@/lib/server/utils/request";
import { enforceAgentRateLimit } from "@/lib/server/utils/rateLimit";
import { rejectIfOverSpendCap } from "@/lib/server/utils/spendCap";
import {
  createSseErrorResponse,
  createSseResponse,
  formatServerError,
} from "@/lib/server/utils/sse";
import { createTokenUsage } from "@/lib/server/utils/anthropicUsage.js";
import { logUsage } from "@/lib/usageLogger";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Public agent — guests and signed-in users may both use it (no 401). */
export async function POST(request: Request) {
  const limited = enforceAgentRateLimit(request);
  if (limited) return limited;

  const body = await readJsonBody(request);
  const userMessage = body?.message;

  if (typeof userMessage !== "string" || !userMessage.trim()) {
    return createSseErrorResponse(
      new Error('Provide a non-empty "message" string'),
    );
  }

  const userId = await resolveRequestUserId();
  const blocked = await rejectIfOverSpendCap(userId);
  if (blocked) return blocked;
  const message = userMessage.trim();
  const model = selectModel("weather", message.length);

  return createSseResponse(async (send) => {
    const startTime = Date.now();
    const usage = createTokenUsage(model);
    let success = true;
    let errorMessage: string | undefined;

    try {
      await streamWeatherChat(message, send, usage, model);
    } catch (error) {
      success = false;
      errorMessage = formatServerError(error);
      throw error;
    } finally {
      await logUsage({
        userId,
        agentType: "weather",
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        durationMs: Date.now() - startTime,
        success,
        errorMessage,
      });
    }
  });
}
