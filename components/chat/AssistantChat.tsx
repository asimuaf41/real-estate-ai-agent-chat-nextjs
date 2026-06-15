"use client";

import type { ReactNode } from "react";
import type { AssistantConfig, ChatMessage } from "@/lib/chat/types";
import { useChatStream } from "@/hooks/useChatStream";
import { WebSearchToolEvents } from "./tool-events/WebSearchToolEvents";
import { WeatherToolEvents } from "./tool-events/WeatherToolEvents";
import { ChatShell } from "./ChatShell";

type ToolRendererId = "web-search" | "weather";

type AssistantChatProps = {
  config: AssistantConfig;
  toolRenderer?: ToolRendererId;
};

function renderToolEvents(
  toolRenderer: ToolRendererId | undefined,
  events: ChatMessage["toolEvents"],
): ReactNode {
  if (!events?.length || !toolRenderer) return null;

  if (toolRenderer === "web-search") {
    return <WebSearchToolEvents events={events} />;
  }

  if (toolRenderer === "weather") {
    return <WeatherToolEvents events={events} />;
  }

  return null;
}

export function AssistantChat({ config, toolRenderer }: AssistantChatProps) {
  const {
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
  } = useChatStream({
    apiUrl: config.apiUrl,
    requestMode: config.requestMode,
    supportsTools: config.supportsTools,
    errorMessage: config.errorMessage,
  });

  return (
    <ChatShell
      config={config}
      messages={messages}
      input={input}
      isStreaming={isStreaming}
      error={error}
      bottomRef={bottomRef}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      onPromptSelect={(prompt) => void sendMessage(prompt)}
      onStop={stopStream}
      renderToolEvents={(events) => renderToolEvents(toolRenderer, events)}
    />
  );
}
