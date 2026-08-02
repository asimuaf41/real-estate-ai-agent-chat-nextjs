import { streamWeatherChat } from "@/lib/server/services/weather.service.js";
import { enforceAgentRateLimit } from "@/lib/server/utils/rateLimit";
import { readJsonBody } from "@/lib/server/utils/request";
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
  const userMessage = body?.message;

  if (typeof userMessage !== "string" || !userMessage.trim()) {
    return createSseErrorResponse(
      new Error('Provide a non-empty "message" string'),
    );
  }

  return createSseResponse(async (send) => {
    await streamWeatherChat(userMessage.trim(), send);
  });
}
