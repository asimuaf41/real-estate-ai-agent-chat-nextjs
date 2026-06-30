"use client";

import { useMemo } from "react";
import { multiAgentAssistant } from "@/config/assistants";
import { DEFAULT_USER_ID } from "@/hooks/useMemories";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatShell } from "./ChatShell";
import { MultiAgentToolEvents } from "./tool-events/MultiAgentToolEvents";

export function MultiAgentChat() {
  const requestExtras = useMemo(() => ({ userId: DEFAULT_USER_ID }), []);

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
    apiUrl: multiAgentAssistant.apiUrl,
    requestMode: multiAgentAssistant.requestMode,
    supportsTools: multiAgentAssistant.supportsTools,
    errorMessage: multiAgentAssistant.errorMessage,
    requestExtras,
  });

  return (
    <ChatShell
      config={multiAgentAssistant}
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
      renderToolEvents={(events) =>
        events ? <MultiAgentToolEvents events={events} /> : null
      }
    />
  );
}
