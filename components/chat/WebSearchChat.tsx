"use client";

import { useCallback, useMemo } from "react";
import { webSearchAssistant } from "@/config/assistants";
import { DEFAULT_USER_ID, useMemories } from "@/hooks/useMemories";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatShell } from "./ChatShell";
import { MemoryPanel } from "./MemoryPanel";
import { WebSearchToolEvents } from "./tool-events/WebSearchToolEvents";

export function WebSearchChat() {
  const {
    memories,
    isLoading: isMemoriesLoading,
    error: memoriesError,
    refetchMemories,
    deleteMemory,
  } = useMemories(DEFAULT_USER_ID);

  const requestExtras = useMemo(() => ({ userId: DEFAULT_USER_ID }), []);
  const handleStreamComplete = useCallback(() => {
    refetchMemories();
  }, [refetchMemories]);

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
    apiUrl: webSearchAssistant.apiUrl,
    requestMode: webSearchAssistant.requestMode,
    supportsTools: webSearchAssistant.supportsTools,
    errorMessage: webSearchAssistant.errorMessage,
    requestExtras,
    onComplete: handleStreamComplete,
  });

  const handleDeleteMemory = useCallback(
    async (memoryId: number) => {
      try {
        await deleteMemory(memoryId);
      } catch (deleteError) {
        console.error("Delete memory error:", deleteError);
      }
    },
    [deleteMemory],
  );

  return (
    <ChatShell
      config={webSearchAssistant}
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
      beforeMessages={
        <MemoryPanel
          memories={memories}
          isLoading={isMemoriesLoading}
          error={memoriesError}
          onDelete={handleDeleteMemory}
        />
      }
      renderToolEvents={(events) =>
        events ? <WebSearchToolEvents events={events} /> : null
      }
    />
  );
}
