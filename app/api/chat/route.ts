import { streamSimpleChat } from "@/lib/server/services/chat.service.js";
import { enforceAgentRateLimit } from "@/lib/server/utils/rateLimit";
import {
  normalizeMessages,
  readJsonBody,
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
  const messages = normalizeMessages(body);

  if (!messages) {
    return createSseErrorResponse(
      new Error('Provide "messages" array or single "message" string'),
    );
  }

  return createSseResponse(async (send) => {
    await streamSimpleChat(messages, send);
  });
}
