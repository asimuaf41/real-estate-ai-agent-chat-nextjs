import { selectModel } from "@/lib/modelSelector";
import { streamWebSearchChat } from "@/lib/server/services/webSearch.service.js";
import { enforceAgentRateLimit } from "@/lib/server/utils/rateLimit";
import {
  latestUserMessageLength,
  normalizeMessages,
  readJsonBody,
  resolveRequestUserId,
} from "@/lib/server/utils/request";
import {
  createSseErrorResponse,
  createSseResponse,
  formatServerError,
} from "@/lib/server/utils/sse";
import { rejectIfOverSpendCap } from "@/lib/server/utils/spendCap";
import { createTokenUsage } from "@/lib/server/utils/anthropicUsage.js";
import { logUsage } from "@/lib/usageLogger";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = enforceAgentRateLimit(request);
  if (limited) return limited;

  const body = await readJsonBody(request);
  const messages = normalizeMessages(body, { sanitize: true });

  if (!messages) {
    return createSseErrorResponse(
      new Error('Provide "messages" array or single "message" string'),
    );
  }

  const userId = await resolveRequestUserId();
  const blocked = await rejectIfOverSpendCap(userId);
  if (blocked) return blocked;
  const model = selectModel("research", latestUserMessageLength(messages));

  return createSseResponse(async (send) => {
    const startTime = Date.now();
    const usage = createTokenUsage(model);
    let success = true;
    let errorMessage: string | undefined;

    try {
      await streamWebSearchChat(messages, userId, send, usage, model);
    } catch (error) {
      success = false;
      errorMessage = formatServerError(error);
      throw error;
    } finally {
      await logUsage({
        userId,
        agentType: "research",
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
