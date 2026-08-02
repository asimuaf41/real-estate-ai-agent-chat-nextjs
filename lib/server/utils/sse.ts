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
        const message =
          error instanceof Error ? error.message : "Unknown error";
        send({ error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

export function createSseErrorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeSseData({ error: message }));
      controller.close();
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
