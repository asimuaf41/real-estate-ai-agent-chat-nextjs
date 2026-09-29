"use client";

import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { logger } from "@/lib/logger";

type FallbackRender = (error: Error, reset: () => void) => ReactNode;

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode | FallbackRender;
};

type ErrorBoundaryState = {
  error: Error | null;
  resetKey: number;
};

function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-md">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-danger">
          Something went wrong
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">
          This view hit an unexpected error
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Try again without leaving the workspace. If it keeps happening, refresh
          the page.
        </p>
        {process.env.NODE_ENV === "development" ? (
          <p className="mt-3 break-words font-mono text-xs text-danger">
            {error.message}
          </p>
        ) : null}
        <Button type="button" className="mt-6" onClick={onReset}>
          Try again
        </Button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
    resetKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
      return;
    }

    logger.error("ErrorBoundary caught an error", {
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  reset = () => {
    this.setState((state) => ({
      error: null,
      resetKey: state.resetKey + 1,
    }));
  };

  render() {
    const { children, fallback } = this.props;
    const { error, resetKey } = this.state;

    if (error) {
      if (typeof fallback === "function") {
        return fallback(error, this.reset);
      }

      if (fallback) {
        return fallback;
      }

      return <DefaultErrorFallback error={error} onReset={this.reset} />;
    }

    return <Fragment key={resetKey}>{children}</Fragment>;
  }
}
