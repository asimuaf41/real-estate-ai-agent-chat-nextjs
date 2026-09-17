import { createClient } from "@/lib/supabase/server";
import { sanitizeChatMessages } from "./sanitizeMessages.js";

type ChatMessage = { role: string; content: string };

export const ANONYMOUS_USER_ID = "anonymous";

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

/**
 * Resolve the request identity from the Supabase session cookie.
 * Never trust client-supplied userId (body/query) — it can be spoofed.
 * Guests get a shared "anonymous" id (no durable per-user memory).
 */
export async function resolveRequestUserId(): Promise<string> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    }
  } catch {
    // Missing auth env or cookie issues — treat as guest.
  }

  return ANONYMOUS_USER_ID;
}

/**
 * @deprecated Use resolveRequestUserId() — client-supplied ids are not trusted.
 */
export function resolveUserId(
  _body?: Record<string, unknown> | null,
  _searchParams?: URLSearchParams | null,
): string {
  return ANONYMOUS_USER_ID;
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
