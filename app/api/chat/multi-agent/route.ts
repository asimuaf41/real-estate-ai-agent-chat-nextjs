import { runMultiAgentWorkflow } from "@/lib/server/services/multiAgent.service.js";
import { enforceAgentRateLimit } from "@/lib/server/utils/rateLimit";
import {
  normalizeMessages,
  readJsonBody,
  resolveUserId,
} from "@/lib/server/utils/request";
import {
  createSseErrorResponse,
  createSseResponse,
} from "@/lib/server/utils/sse";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = enforceAgentRateLimit(request);
  if (limited) return limited;

  const body = await readJsonBody(request);
  const messages = normalizeMessages(body, { sanitize: true });

  if (!messages) {
    return createSseErrorResponse(
      new Error('Provide a "messages" array or a "message" string.'),
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = resolveUserId(body, searchParams);

  return createSseResponse(async (send) => {
    await runMultiAgentWorkflow(messages, userId, send);
  });
}
