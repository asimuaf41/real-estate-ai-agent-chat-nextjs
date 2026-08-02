import Anthropic from "@anthropic-ai/sdk";
import { requireAnthropicApiKey } from "./env.js";

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
