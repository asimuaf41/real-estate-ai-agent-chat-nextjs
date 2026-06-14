"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { readSseStream } from "@/lib/chat/parse-sse-stream";
import type { ChatMessage, RequestMode, StreamEvent, ToolEvent } from "@/lib/chat/types";

type UseChatStreamOptions = {
  apiUrl: string;
  requestMode: RequestMode;
  supportsTools: boolean;
  errorMessage: string;
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
) {
  if (requestMode === "messages") {
    return { messages: [...messages, { role: "user" as const, content }] };
  }

  return { message: content };
}

export function useChatStream({
  apiUrl,
  requestMode,
  supportsTools,
  errorMessage,
}: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  const sendMessage = useCallback(
    async (messageOverride?: string) => {
      const nextContent = (messageOverride ?? input).trim();
      if (!nextContent || isStreaming) return;

      const userMessage: ChatMessage = { role: "user", content: nextContent };

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
            buildRequestBody(requestMode, nextContent, messages),
          ),
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No stream received from API.");
        }

        for await (const event of readSseStream(response.body)) {
          handleStreamEvent(event);
        }
      } catch (streamError) {
        console.error("Stream error:", streamError);
        setError(errorMessage);
        setMessages((previous) => {
          const updated = [...previous];
          const last = updated[updated.length - 1];

          if (last?.role === "assistant" && !last.content.trim()) {
            updated[updated.length - 1] = {
              ...last,
              content:
                "I hit a connection issue while streaming. Please try again.",
            };
          }

          return updated;
        });
      } finally {
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
      supportsTools,
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
    handleSubmit,
    handleKeyDown,
    isEmpty: messages.length === 0,
  };
}
