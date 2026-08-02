import { streamRealEstateChat } from "@/lib/server/services/realEstate.service.js";
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
  const messages = normalizeMessages(body, { sanitize: true });

  if (!messages || messages.length === 0) {
    return createSseErrorResponse(
      new Error('Provide a "messages" array or a "message" string.'),
    );
  }

  return createSseResponse(async (send) => {
    await streamRealEstateChat(messages, send);
  });
}
