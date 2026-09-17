"use client";

import { multiAgentAssistant } from "@/config/assistants";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatShell } from "./ChatShell";
import { MultiAgentToolEvents } from "./tool-events/MultiAgentToolEvents";

export function MultiAgentChat() {
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
