"use client";

import { multiAgentAssistant } from "@/config/assistants";
import { useChatStream } from "@/hooks/useChatStream";
import type { ChatMessage } from "@/lib/chat/types";
import { AgentPipeline, deriveAgentStatuses } from "./AgentPipeline";
import { ChatShell } from "./ChatShell";
import { MultiAgentEmptyState } from "./MultiAgentEmptyState";
import { MultiAgentReportView } from "./MultiAgentReportView";
import { MultiAgentToolEvents } from "./tool-events/MultiAgentToolEvents";

function extractEmailRecipient(message: ChatMessage): string | null {
  const events = message.toolEvents ?? [];

  for (const event of events) {
    if (event.tool === "orchestrator" && event.result?.plan) {
      const plan = event.result.plan as Record<string, unknown>;
      if (typeof plan.recipient === "string" && plan.recipient.trim()) {
        return plan.recipient.trim();
      }
    }
    if (
      event.tool === "communication_agent" &&
      typeof event.input?.recipient === "string" &&
      event.input.recipient.trim()
    ) {
      return event.input.recipient.trim();
    }
  }

  return null;
}

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
    retryLast,
    handleSubmit,
    handleKeyDown,
  } = useChatStream({
    apiUrl: multiAgentAssistant.apiUrl,
    requestMode: multiAgentAssistant.requestMode,
    supportsTools: multiAgentAssistant.supportsTools,
    errorMessage: multiAgentAssistant.errorMessage,
  });

  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const liveEvents = latestAssistant?.toolEvents;
  const statuses = deriveAgentStatuses(liveEvents, isStreaming);
  const showLivePipeline = messages.length > 0;

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
      onRetry={() => void retryLast()}
      showQuickPromptChips={false}
      inputRows={4}
      beforeMessages={
        showLivePipeline ? (
          <div className="sticky top-0 z-10 rounded-xl border border-border bg-surface/95 px-3 py-3 shadow-sm backdrop-blur-md sm:px-4">
            <AgentPipeline
              statuses={statuses}
              isLive={isStreaming}
              compact
            />
          </div>
        ) : null
      }
      renderEmptyState={(onPromptSelect) => (
        <MultiAgentEmptyState onPromptSelect={onPromptSelect} />
      )}
      renderToolEvents={(events) =>
        events ? <MultiAgentToolEvents events={events} /> : null
      }
      renderAssistantContent={({ content, isStreaming: streaming, message }) =>
        content.trim() || streaming ? (
          <MultiAgentReportView
            content={content}
            isStreaming={streaming}
            emailRecipient={extractEmailRecipient(message)}
          />
        ) : null
      }
    />
  );
}
