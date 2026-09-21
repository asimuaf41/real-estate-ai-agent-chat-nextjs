import { WEB_SEARCH_SYSTEM_PROMPT } from '../prompts/webSearchPrompt.js';
import { webSearchTools } from '../tools/webSearch/definitions.js';
import { createWebSearchToolRunner } from '../tools/webSearch/handlers.js';
import { streamAgentWithTools } from '../utils/agentLoop.js';

export async function streamWebSearchChat(messages, userId, onEvent, usage, model) {
  const resolvedUserId = userId || 'anonymous';

  return streamAgentWithTools({
    system: WEB_SEARCH_SYSTEM_PROMPT,
    tools: webSearchTools,
    messages,
    runTool: createWebSearchToolRunner(resolvedUserId),
    onEvent,
    maxTokens: 4096,
    usage,
    model,
    userId: resolvedUserId,
    agentType: 'research',
  });
}
