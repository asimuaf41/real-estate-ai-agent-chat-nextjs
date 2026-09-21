export type LogLevel = "info" | "warn" | "error" | "debug";

export type LogContext = Record<string, unknown>;

export type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
};

const consoleWriters: Record<LogLevel, (...args: unknown[]) => void> = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => console.debug(...args),
};

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function serializeValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
  }

  return value;
}

function serializeContext(context: LogContext | undefined): LogContext {
  return context ?? {};
}

function stringifyEntry(entry: LogEntry, pretty: boolean): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    entry,
    (_key, value) => serializeValue(value, seen),
    pretty ? 2 : undefined,
  );
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: serializeContext(context),
  };

  const pretty = !isProduction();
  consoleWriters[level](stringifyEntry(entry, pretty));
}

export const logger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
  debug(message: string, context?: LogContext) {
    write("debug", message, context);
  },
};
