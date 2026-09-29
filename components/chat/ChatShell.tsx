"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { LoginModal } from "@/components/LoginModal";
import { AppShell } from "@/components/layout/AppShell";
import { SearchLimitBanner } from "@/components/SearchLimitBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Input";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import type { AssistantConfig, ChatMessage, PromptCard } from "@/lib/chat/types";
import { accentClasses } from "@/lib/ui/accent";
import { cn } from "@/lib/ui/cn";
import { AssistantEmptyState } from "./AssistantEmptyState";
import { MarkdownContent } from "./MarkdownContent";
import { TypingDots } from "./TypingDots";

type ChatMessageListProps = {
  messages: ChatMessage[];
  isStreaming: boolean;
  accent: AssistantConfig["theme"]["accent"];
  renderToolEvents?: (events: ChatMessage["toolEvents"]) => ReactNode;
  renderAssistantContent?: (args: {
    content: string;
    isStreaming: boolean;
    message: ChatMessage;
  }) => ReactNode;
};

function MessageSkeleton() {
  return (
    <div className="space-y-2 py-1">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function ChatMessageList({
  messages,
  isStreaming,
  accent,
  renderToolEvents,
  renderAssistantContent,
}: ChatMessageListProps) {
  const accentStyle = accentClasses[accent];

  return (
    <>
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isLastAssistantStreaming =
          !isUser && isStreaming && index === messages.length - 1;
        const hasToolEvents = Boolean(message.toolEvents?.length);
        const hasContent = Boolean(message.content || isLastAssistantStreaming);
        const useCustomContent = !isUser && Boolean(renderAssistantContent);

        return (
          <div
            key={`${message.role}-${index}`}
            className={cn("flex", isUser ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                useCustomContent
                  ? "w-full max-w-full space-y-3"
                  : "max-w-[min(100%,42rem)] rounded-xl px-4 py-3 text-sm leading-7 shadow-sm",
                isUser
                  ? cn("rounded-br-md text-white", accentStyle.userBubble)
                  : useCustomContent
                    ? ""
                    : "rounded-bl-md border border-border bg-surface text-foreground",
              )}
            >
              {!isUser && hasToolEvents && renderToolEvents
                ? renderToolEvents(message.toolEvents)
                : null}

              {hasContent ? (
                useCustomContent && renderAssistantContent ? (
                  renderAssistantContent({
                    content: message.content,
                    isStreaming: isLastAssistantStreaming,
                    message,
                  })
                ) : isUser ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div>
                    <MarkdownContent content={message.content} />
                    {isLastAssistantStreaming ? <TypingDots /> : null}
                  </div>
                )
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
  onStop: () => void;
  onRetry?: () => void;
  beforeMessages?: ReactNode;
  renderEmptyState?: (onPromptSelect: (prompt: string) => void) => ReactNode;
  renderToolEvents?: (events: ChatMessage["toolEvents"]) => ReactNode;
  renderAssistantContent?: (args: {
    content: string;
    isStreaming: boolean;
    message: ChatMessage;
  }) => ReactNode;
  showQuickPromptChips?: boolean;
  inputRows?: number;
};

function promptsToCards(config: AssistantConfig): PromptCard[] {
  if (config.promptCards?.length) return config.promptCards;
  return config.quickPrompts.map((prompt) => ({
    title: prompt.split(/[.?!]/)[0]?.slice(0, 42) || "Try this",
    detail: prompt.length > 90 ? `${prompt.slice(0, 90)}…` : prompt,
    prompt,
  }));
}

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
  onStop,
  onRetry,
  beforeMessages,
  renderEmptyState,
  renderToolEvents,
  renderAssistantContent,
  showQuickPromptChips,
  inputRows = 3,
}: ChatShellProps) {
  const router = useRouter();
  const accentStyle = accentClasses[config.theme.accent];
  const [showModal, setShowModal] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const { hasReachedLimit, incrementCount, resetCount } = useSearchLimit();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const stickToBottomRef = useRef(true);

  function consumeSearchOrPromptLogin() {
    if (hasReachedLimit()) {
      setShowModal(true);
      return false;
    }
    incrementCount();
    return true;
  }

  function handleSubmitGuarded(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || isStreaming) return;
    if (!consumeSearchOrPromptLogin()) return;
    stickToBottomRef.current = true;
    onSubmit(event);
  }

  function handleKeyDownGuarded(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      if (!input.trim() || isStreaming) return;
      if (!consumeSearchOrPromptLogin()) {
        event.preventDefault();
        return;
      }
      stickToBottomRef.current = true;
    }
    onKeyDown(event);
  }

  function handlePromptSelectGuarded(prompt: string) {
    if (isStreaming) return;
    if (!consumeSearchOrPromptLogin()) return;
    stickToBottomRef.current = true;
    onPromptSelect(prompt);
  }

  useEffect(() => {
    function onWindowKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, bottomRef]);

  function handleScroll() {
    const node = scrollRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    const nearBottom = distance < 96;
    stickToBottomRef.current = nearBottom;
    setShowJump(!nearBottom && messages.length > 0);
  }

  const isEmpty = messages.length === 0;
  const cards = promptsToCards(config);

  return (
    <AppShell
      title={config.title}
      description={config.description}
      eyebrow={config.eyebrow}
      onSignInClick={() => setShowModal(true)}
    >
      <ErrorBoundary>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
          >
            <SearchLimitBanner onSignInClick={() => setShowModal(true)} />
            {beforeMessages}
            {isEmpty ? (
              renderEmptyState ? (
                renderEmptyState(handlePromptSelectGuarded)
              ) : (
                <AssistantEmptyState
                  eyebrow={config.eyebrow}
                  title={`What can ${config.label} help with?`}
                  description="Choose an example below, or write your own request."
                  accent={config.theme.accent}
                  promptCards={cards}
                  onPromptSelect={handlePromptSelectGuarded}
                />
              )
            ) : (
              <ChatMessageList
                messages={messages}
                isStreaming={isStreaming}
                accent={config.theme.accent}
                renderToolEvents={renderToolEvents}
                renderAssistantContent={renderAssistantContent}
              />
            )}
            <div ref={bottomRef} />
          </div>

          {showJump ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-28 flex justify-center lg:bottom-24">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="pointer-events-auto shadow-md"
                onClick={() => {
                  stickToBottomRef.current = true;
                  setShowJump(false);
                  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Jump to latest
              </Button>
            </div>
          ) : null}

          <section className="border-t border-border bg-surface px-4 py-3 sm:px-6">
            {(showQuickPromptChips ?? !isEmpty) ? (
              <div className="mb-3 hidden flex-wrap gap-2 sm:flex">
                {cards.slice(0, 3).map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => onInputChange(card.prompt)}
                    className={cn(
                      "focus-ring rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-muted transition duration-(--duration-fast) disabled:opacity-50",
                      accentStyle.chip,
                    )}
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            ) : null}

            <form
              onSubmit={handleSubmitGuarded}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={handleKeyDownGuarded}
                placeholder={config.placeholder}
                disabled={isStreaming}
                rows={inputRows}
                aria-label="Message"
                className={cn("max-h-40 sm:max-h-48", accentStyle.ring)}
              />
              {isStreaming ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={onStop}
                  className="shrink-0 sm:min-w-28"
                >
                  Stop
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  variant="ghost"
                  disabled={!input.trim()}
                  className={cn(
                    "shrink-0 border-0 text-white sm:min-w-28",
                    accentStyle.solid,
                  )}
                >
                  {config.submitLabel}
                </Button>
              )}
            </form>

            <div className="mt-2 flex items-center justify-between gap-3">
              {isStreaming ? (
                <p className={cn("text-xs", accentStyle.text)}>
                  {config.streamingLabel}
                </p>
              ) : (
                <p className="text-[11px] text-subtle">
                  Enter to send · Shift+Enter for a new line
                </p>
              )}
            </div>

            {error ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger-muted px-3 py-2.5">
                <p className="text-sm text-danger">{error}</p>
                {onRetry ? (
                  <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
                    Retry
                  </Button>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </ErrorBoundary>

      <LoginModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          resetCount();
          setShowModal(false);
          router.refresh();
        }}
      />
    </AppShell>
  );
}
