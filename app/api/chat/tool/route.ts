import { selectModel } from "@/lib/modelSelector";
import { streamToolChat } from "@/lib/server/services/chat.service.js";
import { enforceAgentRateLimit } from "@/lib/server/utils/rateLimit";
import {
  parseUserMessage,
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

/** Public agent — guests and signed-in users may both use it (no 401). */
export async function POST(request: Request) {
  const limited = enforceAgentRateLimit(request);
  if (limited) return limited;

  const body = await readJsonBody(request);
  const parsed = parseUserMessage(body?.message);
  if (!parsed.valid || parsed.value === undefined) {
    return createSseErrorResponse(
      new Error(parsed.error ?? 'Provide a non-empty "message" string'),
    );
  }

  const userId = await resolveRequestUserId(request);
  const blocked = await rejectIfOverSpendCap(userId);
  if (blocked) return blocked;
  const message = parsed.value;
  const model = selectModel("rag", message.length);

  return createSseResponse(async (send) => {
    const startTime = Date.now();
    const usage = createTokenUsage(model);
    let success = true;
    let errorMessage: string | undefined;

    try {
      await streamToolChat(message, send, usage, model, userId);
    } catch (error) {
      success = false;
      errorMessage = formatServerError(error);
      throw error;
    } finally {
      await logUsage({
        userId,
        agentType: "rag",
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
