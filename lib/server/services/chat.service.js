import { withRetry } from '@/lib/retry';
import { anthropicClient } from '../config/anthropic.js';
import { REAL_ESTATE_SYSTEM_PROMPT } from '../prompts/realEstatePrompt.js';
import { tools } from '../tools/definitions.js';
import { runTool } from '../tools/handlers.js';
import { streamAgentWithTools } from '../utils/agentLoop.js';
import { collectStreamUsage } from '../utils/anthropicUsage.js';

export async function streamSimpleChat(messages, onEvent, usage, model) {
  if (usage) {
    usage.model = model;
  }

  const stream = await withRetry(() =>
    anthropicClient.messages.stream({
      model,
      max_tokens: 400,
      system: REAL_ESTATE_SYSTEM_PROMPT,
      messages
    })
  );

  try {
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta?.type === 'text_delta' &&
        chunk.delta.text
      ) {
        onEvent({ text: chunk.delta.text });
      }
    }
  } finally {
    await collectStreamUsage(stream, usage);
  }

  return usage;
}

export async function streamToolChat(singleMessage, onEvent, usage, model, userId) {
  return streamAgentWithTools({
    system: REAL_ESTATE_SYSTEM_PROMPT,
    tools,
    messages: [{ role: 'user', content: singleMessage }],
    runTool: async (name, input) => runTool(name, input),
    onEvent,
    usage,
    model,
    userId,
    agentType: 'rag',
  });
}
