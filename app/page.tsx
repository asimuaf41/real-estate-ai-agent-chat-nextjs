"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type MessageRole = "user" | "assistant";

type ChatMessage = {
  role: MessageRole;
  content: string;
};

type StreamEvent = {
  text?: string;
  done?: boolean;
  error?: string;
};

const quickPrompts = [
  "Show me 3 modern apartments under $500k in downtown.",
  "Find family-friendly homes with a backyard near top schools.",
  "Compare two-bedroom condos with low HOA fees.",
  "Give me an investment property analysis for rental yield.",
];

function TypingDots() {
  return (
    <span
      className="inline-flex items-center gap-1 pl-1"
      aria-label="AI is typing"
    >
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
    </span>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const appendAssistantChunk = (chunkText: string) => {
    setMessages((previous) => {
      if (previous.length === 0) {
        return [{ role: "assistant", content: chunkText }];
      }

      const updated = [...previous];
      const lastIndex = updated.length - 1;
      const last = updated[lastIndex];

      if (last.role === "assistant") {
        updated[lastIndex] = {
          ...last,
          content: `${last.content}${chunkText}`,
        };
        return updated;
      }

      updated.push({ role: "assistant", content: chunkText });
      return updated;
    });
  };

  const sendMessage = async (messageOverride?: string) => {
    const nextContent = (messageOverride ?? input).trim();
    if (!nextContent || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: nextContent };
    const updatedMessages = [...messages, userMessage];

    setErrorMessage("");
    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No stream received from API.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || !line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (!payload) continue;

          try {
            const data = JSON.parse(payload) as StreamEvent;

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.done) {
              setIsStreaming(false);
              continue;
            }

            if (data.text) {
              appendAssistantChunk(data.text);
            }
          } catch (parseError) {
            console.error("Failed to parse stream chunk:", parseError);
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      setErrorMessage(
        "Could not reach your AI server. Check if port 3001 is running.",
      );
      setMessages((previous) => {
        const updated = [...previous];
        const last = updated[updated.length - 1];
        if (last && last.role === "assistant" && !last.content.trim()) {
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              "I hit a connection issue while streaming. Please try again.",
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const emptyState = messages.length === 0;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-2xl backdrop-blur">
        <header className="border-b border-slate-200/80 bg-linear-to-r from-sky-900 via-sky-800 to-cyan-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/90">
            Real Estate AI Assistant
          </p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
            Property Concierge Chat
          </h1>
          <p className="mt-1 text-sm text-cyan-100/90">
            Ask for listings, comparisons, area insights, or investment
            guidance.
          </p>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {emptyState ? (
              <section className="flex h-full flex-col items-center justify-center">
                <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/95 p-8 text-center shadow-sm">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Find the perfect property faster
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Start typing your own question or tap one of these smart
                    prompts.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        disabled={isStreaming}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              messages.map((message, index) => {
                const isUser = message.role === "user";
                const isLastAssistantStreaming =
                  !isUser && isStreaming && index === messages.length - 1;

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm sm:max-w-[75%]",
                        isUser
                          ? "rounded-br-md bg-linear-to-br from-sky-600 to-cyan-500 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
                      ].join(" ")}
                    >
                      {message.content || isLastAssistantStreaming ? (
                        <p className="whitespace-pre-wrap">
                          {message.content}
                          {isLastAssistantStreaming ? <TypingDots /> : null}
                        </p>
                      ) : (
                        <div className="space-y-2 py-1">
                          <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
                          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <section className="mt-4 space-y-3 border-t border-slate-200 pt-4">
            {!emptyState ? (
              <div className="flex flex-wrap gap-2">
                {quickPrompts.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    disabled={isStreaming}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about property prices, nearby schools, investment ROI..."
                disabled={isStreaming}
                rows={2}
                className="max-h-40 min-h-[56px] flex-1 resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-linear-to-r from-sky-600 to-cyan-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-200/80 transition hover:-translate-y-0.5 hover:from-sky-700 hover:to-cyan-600 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStreaming ? "Streaming..." : "Send"}
              </button>
            </form>

            {errorMessage ? (
              <p className="text-xs text-rose-600">{errorMessage}</p>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
