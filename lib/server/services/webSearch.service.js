import { env } from '../config/env.js';
import { WEB_SEARCH_SYSTEM_PROMPT } from '../prompts/webSearchPrompt.js';
import { webSearchTools } from '../tools/webSearch/definitions.js';
import { createWebSearchToolRunner } from '../tools/webSearch/handlers.js';
import { streamAgentWithTools } from '../utils/agentLoop.js';

export async function streamWebSearchChat(messages, userId, onEvent) {
  const resolvedUserId = userId || env.defaultUserId;

  await streamAgentWithTools({
    system: WEB_SEARCH_SYSTEM_PROMPT,
    tools: webSearchTools,
    messages,
    runTool: createWebSearchToolRunner(resolvedUserId),
    onEvent,
    maxTokens: 4096
  });
}
