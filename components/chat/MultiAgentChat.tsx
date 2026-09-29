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
      showReliabilityNotes={false}
      showQuickPromptChips={false}
      inputRows={4}
      shellMaxWidthClassName="max-w-7xl"
      beforeMessages={
        showLivePipeline ? (
          <div className="sticky top-0 z-10 -mx-1 rounded-2xl border border-white/10 bg-zinc-950/90 px-3 py-3 backdrop-blur-md sm:px-4">
            <AgentPipeline
              statuses={statuses}
              isLive={isStreaming}
              compact={isStreaming}
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
