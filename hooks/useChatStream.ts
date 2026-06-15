"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { readSseStream } from "@/lib/chat/parse-sse-stream";
import { sanitizeChatMessages } from "@/lib/chat/sanitize-messages";
import type { ChatMessage, RequestMode, StreamEvent, ToolEvent } from "@/lib/chat/types";

type UseChatStreamOptions = {
  apiUrl: string;
  requestMode: RequestMode;
  supportsTools: boolean;
  errorMessage: string;
  requestExtras?: Record<string, unknown>;
  onComplete?: () => void;
};

function createAssistantMessage(supportsTools: boolean): ChatMessage {
  return supportsTools
    ? { role: "assistant", content: "", toolEvents: [] }
    : { role: "assistant", content: "" };
}

function buildRequestBody(
  requestMode: RequestMode,
  content: string,
  messages: ChatMessage[],
  requestExtras: Record<string, unknown> = {},
) {
  if (requestMode === "messages") {
    return {
      ...requestExtras,
      messages: [
        ...sanitizeChatMessages(messages),
        { role: "user" as const, content },
      ],
    };
  }

  return { ...requestExtras, message: content };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function useChatStream({
  apiUrl,
  requestMode,
  supportsTools,
  errorMessage,
  requestExtras = {},
  onComplete,
}: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const appendAssistantChunk = useCallback((chunkText: string) => {
    setMessages((previous) => {
      const updated = [...previous];
      const last = updated[updated.length - 1];

      if (last?.role === "assistant") {
        updated[updated.length - 1] = {
          ...last,
          content: `${last.content}${chunkText}`,
        };
        return updated;
      }

      updated.push(
        supportsTools
          ? { role: "assistant", content: chunkText, toolEvents: [] }
          : { role: "assistant", content: chunkText },
      );
      return updated;
    });
  }, [supportsTools]);

  const appendToolEvent = useCallback((event: ToolEvent) => {
    setMessages((previous) => {
      const updated = [...previous];
      const last = updated[updated.length - 1];

      if (last?.role === "assistant") {
        updated[updated.length - 1] = {
          ...last,
          toolEvents: [...(last.toolEvents ?? []), event],
        };
        return updated;
      }

      updated.push({ role: "assistant", content: "", toolEvents: [event] });
      return updated;
    });
  }, []);

  const handleStreamEvent = useCallback(
    (event: StreamEvent) => {
      if (event.error) {
        throw new Error(event.error);
      }

      if (event.done) {
        return;
      }

      if (event.type === "tool_use" && event.tool) {
        appendToolEvent({
          type: "tool_use",
          tool: event.tool,
          input: event.input,
        });
        return;
      }

      if (event.type === "tool_result" && event.tool) {
        appendToolEvent({
          type: "tool_result",
          tool: event.tool,
          result: event.result,
        });
        return;
      }

      if (event.text) {
        appendAssistantChunk(event.text);
      }
    },
    [appendAssistantChunk, appendToolEvent],
  );

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (messageOverride?: string) => {
      const nextContent = (messageOverride ?? input).trim();
      if (!nextContent || isStreaming) return;

      const userMessage: ChatMessage = { role: "user", content: nextContent };
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setError("");
      setMessages((previous) => [
        ...previous,
        userMessage,
        createAssistantMessage(supportsTools),
      ]);
      setInput("");
      setIsStreaming(true);

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            buildRequestBody(requestMode, nextContent, messages, requestExtras),
          ),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            errorBody || `Request failed with status ${response.status}`,
          );
        }

        if (!response.body) {
          throw new Error("No stream received from API.");
        }

        for await (const event of readSseStream(
          response.body,
          abortController.signal,
        )) {
          handleStreamEvent(event);
        }

        if (!abortController.signal.aborted) {
          onComplete?.();
        }
      } catch (streamError) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error("Stream error:", streamError);
        const resolvedError = getErrorMessage(streamError, errorMessage);
        setError(resolvedError);
        setMessages((previous) => {
          const updated = [...previous];
          const last = updated[updated.length - 1];

          if (last?.role === "assistant" && !last.content.trim()) {
            updated[updated.length - 1] = {
              ...last,
              content: resolvedError,
            };
          }

          return updated;
        });
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
        setIsStreaming(false);
      }
    },
    [
      apiUrl,
      errorMessage,
      handleStreamEvent,
      input,
      isStreaming,
      messages,
      requestMode,
      requestExtras,
      supportsTools,
      onComplete,
    ],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendMessage();
    },
    [sendMessage],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  return {
    messages,
    input,
    setInput,
    isStreaming,
    error,
    bottomRef,
    sendMessage,
    stopStream,
    handleSubmit,
    handleKeyDown,
    isEmpty: messages.length === 0,
  };
}
