import Anthropic from "@anthropic-ai/sdk";
import { requireAnthropicApiKey } from "./env.js";

export const DEFAULT_CHAT_MODEL = "claude-haiku-4-5-20251001";

let client = null;

export function getAnthropicClient() {
  if (!client) {
    client = new Anthropic({
      apiKey: requireAnthropicApiKey(),
    });
  }
  return client;
}

/** Lazy proxy so builds succeed without env vars loaded at import time. */
export const anthropicClient = new Proxy(
  {},
  {
    get(_target, property) {
      const value = getAnthropicClient()[property];
      return typeof value === "function" ? value.bind(getAnthropicClient()) : value;
    },
  },
);
