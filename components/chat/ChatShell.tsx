"use client";

import type { FormEvent, KeyboardEvent, ReactNode, RefObject } from "react";
import type { AssistantConfig, ChatMessage } from "@/lib/chat/types";
import { AssistantSwitcher } from "./AssistantSwitcher";
import { TypingDots } from "./TypingDots";

type ChatMessageListProps = {
  messages: ChatMessage[];
  isStreaming: boolean;
  theme: AssistantConfig["theme"];
  emptyTitle: string;
  emptyDescription: string;
  quickPrompts: string[];
  onPromptSelect: (prompt: string) => void;
  renderToolEvents?: (events: ChatMessage["toolEvents"]) => ReactNode;
};

function MessageSkeleton() {
  return (
    <div className="space-y-2 py-1">
      <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
      <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
    </div>
  );
}

export function ChatMessageList({
  messages,
  isStreaming,
  theme,
  emptyTitle,
  emptyDescription,
  quickPrompts,
  onPromptSelect,
  renderToolEvents,
}: ChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <section className="flex h-full flex-col items-center justify-center px-2">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900/50 p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-sm">
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.accentText}`}>
            Premium AI Workspace
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{emptyTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{emptyDescription}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPromptSelect(prompt)}
                className={`rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-zinc-300 transition hover:-translate-y-0.5 ${theme.emptyStateHover}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isLastAssistantStreaming =
          !isUser && isStreaming && index === messages.length - 1;
        const hasToolEvents = Boolean(message.toolEvents?.length);
        const hasContent = Boolean(message.content || isLastAssistantStreaming);

        return (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={[
                "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-lg sm:max-w-[78%]",
                isUser
                  ? `rounded-br-md ${theme.userBubble}`
                  : `rounded-bl-md ${theme.assistantBubble}`,
              ].join(" ")}
            >
              {!isUser && hasToolEvents && renderToolEvents
                ? renderToolEvents(message.toolEvents)
                : null}

              {hasContent ? (
                <p className="whitespace-pre-wrap">
                  {message.content}
                  {isLastAssistantStreaming ? <TypingDots /> : null}
                </p>
              ) : !hasToolEvents ? (
                <MessageSkeleton />
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}

type ChatInputProps = {
  input: string;
  isStreaming: boolean;
  placeholder: string;
  submitLabel: string;
  streamingLabel: string;
  theme: AssistantConfig["theme"];
  quickPrompts: string[];
  showQuickPrompts: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPromptFill: (prompt: string) => void;
};

export function ChatInput({
  input,
  isStreaming,
  placeholder,
  submitLabel,
  streamingLabel,
  theme,
  quickPrompts,
  showQuickPrompts,
  onInputChange,
  onSubmit,
  onKeyDown,
  onPromptFill,
}: ChatInputProps) {
  return (
    <section className="space-y-3 border-t border-white/10 pt-4">
      {showQuickPrompts ? (
        <div className="flex flex-wrap gap-2">
          {quickPrompts.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPromptFill(prompt)}
              disabled={isStreaming}
              className={`rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-medium text-zinc-400 transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.chipHover}`}
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          rows={2}
          className={`max-h-40 min-h-[56px] flex-1 resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 ${theme.inputFocus}`}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className={`inline-flex h-14 items-center justify-center rounded-2xl bg-linear-to-r px-6 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${theme.accentGradient} ${theme.accentShadow}`}
        >
          {isStreaming ? streamingLabel : submitLabel}
        </button>
      </form>
    </section>
  );
}

type ChatShellProps = {
  config: AssistantConfig;
  messages: ChatMessage[];
  input: string;
  isStreaming: boolean;
  error: string;
  bottomRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPromptSelect: (prompt: string) => void;
  renderToolEvents?: (events: ChatMessage["toolEvents"]) => ReactNode;
};

export function ChatShell({
  config,
  messages,
  input,
  isStreaming,
  error,
  bottomRef,
  onInputChange,
  onSubmit,
  onKeyDown,
  onPromptSelect,
  renderToolEvents,
}: ChatShellProps) {
  const { theme } = config;

  return (
    <div className={`min-h-screen px-4 py-6 sm:px-6 lg:px-8 ${theme.pageBackground}`}>
      <div
        className={`mx-auto flex h-[calc(100vh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border bg-zinc-950/70 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl ${theme.shellBorder}`}
      >
        <header className={`px-5 py-5 sm:px-6 ${theme.headerBackground}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${theme.headerEyebrow}`}>
                {config.eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {config.title}
              </h1>
              <p className={`mt-2 text-sm leading-6 ${theme.headerDescription}`}>
                {config.description}
              </p>
            </div>
            <AssistantSwitcher />
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <ChatMessageList
              messages={messages}
              isStreaming={isStreaming}
              theme={theme}
              emptyTitle={`Start with ${config.label}`}
              emptyDescription={config.description}
              quickPrompts={config.quickPrompts}
              onPromptSelect={onPromptSelect}
              renderToolEvents={renderToolEvents}
            />
            <div ref={bottomRef} />
          </div>

          <ChatInput
            input={input}
            isStreaming={isStreaming}
            placeholder={config.placeholder}
            submitLabel={config.submitLabel}
            streamingLabel={config.streamingLabel}
            theme={theme}
            quickPrompts={config.quickPrompts}
            showQuickPrompts={messages.length > 0}
            onInputChange={onInputChange}
            onSubmit={onSubmit}
            onKeyDown={onKeyDown}
            onPromptFill={onInputChange}
          />

          {error ? <p className="text-xs text-rose-400">{error}</p> : null}
        </main>
      </div>
    </div>
  );
}
