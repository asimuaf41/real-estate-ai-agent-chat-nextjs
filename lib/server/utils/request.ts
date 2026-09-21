import { createClient } from "@/lib/supabase/server";
import {
  sanitizeInput,
  validateMessage,
  type ValidationResult,
} from "@/lib/validation";
import { sanitizeChatMessages } from "./sanitizeMessages.js";

type ChatMessage = { role: string; content: string };

export const ANONYMOUS_USER_ID = "anonymous";

function cleanedContent(content: unknown): string {
  const result = sanitizeInput(typeof content === "string" ? content : "");
  return result.value ?? "";
}

function withSanitizedContent(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .map((message) => ({
      ...message,
      content: cleanedContent(message.content),
    }))
    .filter((message) => message.content.length > 0);
}

export function normalizeMessages(
  payload: Record<string, unknown> | null | undefined,
  { sanitize = false }: { sanitize?: boolean } = {},
): ChatMessage[] | null {
  if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
    const messages = sanitize
      ? sanitizeChatMessages(payload.messages)
      : (payload.messages as ChatMessage[]);
    const cleaned = withSanitizedContent(messages);
    return cleaned.length > 0 ? cleaned : null;
  }

  if (typeof payload?.message === "string") {
    const content = cleanedContent(payload.message);
    if (!content) return null;
    return [{ role: "user", content }];
  }

  return null;
}

export function validateNormalizedMessages(
  messages: ChatMessage[],
): ValidationResult {
  for (const message of messages) {
    if (message.role !== "user") continue;
    const result = validateMessage(message.content);
    if (!result.valid) return result;
  }

  return { valid: true };
}

export function parseUserMessage(
  input: unknown,
): ValidationResult & { value?: string } {
  const sanitized = sanitizeInput(input);
  if (!sanitized.valid || sanitized.value === undefined) {
    return {
      valid: false,
      error: sanitized.error ?? "Message must be a string",
    };
  }

  const checked = validateMessage(sanitized.value);
  if (!checked.valid) return checked;

  return { valid: true, value: sanitized.value };
}

export function latestUserMessageLength(messages: ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user" && typeof messages[i].content === "string") {
      return messages[i].content.length;
    }
  }

  return 0;
}

function bearerAccessToken(request?: Request): string | null {
  const header = request?.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

/**
 * Resolve the request identity from the Supabase session cookie, then
 * a validated Authorization bearer token. Never trust client-supplied
 * userId (body/query) — it can be spoofed. Guests get a shared
 * "anonymous" id (no durable per-user memory).
 */
export async function resolveRequestUserId(
  request?: Request,
): Promise<string> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return user.id;
    }
  } catch {
    // Missing auth env or cookie issues — try the bearer token next.
  }

  const accessToken = bearerAccessToken(request);
  if (accessToken) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser(accessToken);
      if (user?.id) {
        return user.id;
      }
    } catch {
      // Invalid or expired token — treat as guest.
    }
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
