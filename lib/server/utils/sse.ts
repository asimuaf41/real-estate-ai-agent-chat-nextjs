type SsePayload = Record<string, unknown>;
type SseSend = (payload: SsePayload) => void;

const encoder = new TextEncoder();

export function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

export function encodeSseData(payload: SsePayload): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/**
 * Node's undici often throws TypeError("fetch failed") with the useful
 * detail in `error.cause` (ENOTFOUND, ECONNREFUSED, TLS, etc.).
 */
export function formatServerError(error: unknown): string {
  if (!(error instanceof Error)) {
    return typeof error === "string" ? error : "Unknown error";
  }

  const parts: string[] = [];
  let current: unknown = error;
  let depth = 0;

  while (current instanceof Error && depth < 4) {
    const code =
      "code" in current && typeof current.code === "string"
        ? current.code
        : undefined;
    const part = code ? `${current.message} (${code})` : current.message;
    if (part && !parts.includes(part)) {
      parts.push(part);
    }
    current = current.cause;
    depth += 1;
  }

  return parts.join(" → ") || "Unknown error";
}

/**
 * Creates an SSE Response that runs `handler(send)` and always ends with
 * either `{ done: true }` or `{ error }` — matching the Express SSE helpers.
 */
export function createSseResponse(
  handler: (send: SseSend) => Promise<void>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const send: SseSend = (payload) => {
        controller.enqueue(encodeSseData(payload));
      };

      try {
        await handler(send);
        send({ done: true });
      } catch (error) {
        const message = formatServerError(error);
        console.error("[sse]", message, error);
        send({ error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

export function createSseErrorResponse(error: unknown): Response {
  const message = formatServerError(error);
  console.error("[sse]", message, error);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeSseData({ error: message }));
      controller.close();
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
