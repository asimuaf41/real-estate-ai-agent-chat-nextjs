"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/ui/cn";

type ToastTone = "neutral" | "success" | "error";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (input: {
    title: string;
    description?: string;
    tone?: ToastTone;
  }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (input: { title: string; description?: string; tone?: ToastTone }) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((previous) => [
        ...previous,
        {
          id,
          title: input.title,
          description: input.description,
          tone: input.tone ?? "neutral",
        },
      ]);
      window.setTimeout(() => {
        setItems((previous) => previous.filter((item) => item.id !== id));
      }, 2600);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(100%,20rem)] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-3.5 py-3 shadow-md backdrop-blur-md transition duration-(--duration-normal)",
              item.tone === "success" &&
                "border-success/30 bg-surface text-foreground",
              item.tone === "error" &&
                "border-danger/30 bg-surface text-foreground",
              item.tone === "neutral" &&
                "border-border bg-surface text-foreground",
            )}
          >
            <p className="text-sm font-semibold">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 text-xs text-muted">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
