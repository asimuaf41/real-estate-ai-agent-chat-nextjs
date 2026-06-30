"use client";

import { useCallback } from "react";
import { realEstateAssistant } from "@/config/assistants";
import { useChatStream } from "@/hooks/useChatStream";
import { useRagDocuments } from "@/hooks/useRagDocuments";
import { ChatShell } from "./ChatShell";
import { DocumentsPanel } from "./DocumentsPanel";
import { RealEstateToolEvents } from "./tool-events/RealEstateToolEvents";

export function RealEstateChat() {
  const {
    documents,
    isLoading: isDocumentsLoading,
    error: documentsError,
    status: documentsStatus,
    seedNotice,
    seedDocuments,
    deleteDocument,
    clearSeedNotice,
  } = useRagDocuments();

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
    apiUrl: realEstateAssistant.apiUrl,
    requestMode: realEstateAssistant.requestMode,
    supportsTools: realEstateAssistant.supportsTools,
    errorMessage: realEstateAssistant.errorMessage,
  });

  const handleSeed = useCallback(() => {
    void seedDocuments(false);
  }, [seedDocuments]);

  const handleForceSeed = useCallback(() => {
    void seedDocuments(true);
  }, [seedDocuments]);

  const handleDeleteDocument = useCallback(
    (sourceFile: string) => {
      void deleteDocument(sourceFile);
    },
    [deleteDocument],
  );

  return (
    <ChatShell
      config={realEstateAssistant}
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
        <DocumentsPanel
          documents={documents}
          isLoading={isDocumentsLoading}
          error={documentsError}
          status={documentsStatus}
          seedNotice={seedNotice}
          onSeed={handleSeed}
          onForceSeed={handleForceSeed}
          onDismissNotice={clearSeedNotice}
          onDelete={handleDeleteDocument}
        />
      }
      renderToolEvents={(events) =>
        events ? <RealEstateToolEvents events={events} /> : null
      }
    />
  );
}
