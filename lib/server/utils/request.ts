import { env } from "../config/env.js";
import { sanitizeChatMessages } from "./sanitizeMessages.js";

type ChatMessage = { role: string; content: string };

export function normalizeMessages(
  payload: Record<string, unknown> | null | undefined,
  { sanitize = false }: { sanitize?: boolean } = {},
): ChatMessage[] | null {
  if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
    return sanitize
      ? sanitizeChatMessages(payload.messages)
      : (payload.messages as ChatMessage[]);
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return [{ role: "user", content: payload.message.trim() }];
  }

  return null;
}

export function resolveUserId(
  body: Record<string, unknown> | null | undefined,
  searchParams?: URLSearchParams | null,
): string {
  const fromBody =
    typeof body?.userId === "string" ? body.userId : undefined;
  return fromBody || searchParams?.get("userId") || env.defaultUserId;
}

export async function readJsonBody(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
