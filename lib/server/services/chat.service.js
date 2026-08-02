import { anthropicClient } from '../config/anthropic.js';
import { REAL_ESTATE_SYSTEM_PROMPT } from '../prompts/realEstatePrompt.js';
import { tools } from '../tools/definitions.js';
import { runTool } from '../tools/handlers.js';
import { streamAgentWithTools } from '../utils/agentLoop.js';

const CHAT_MODEL = 'claude-haiku-4-5-20251001';

export async function streamSimpleChat(messages, onEvent) {
  const stream = await anthropicClient.messages.stream({
    model: CHAT_MODEL,
    max_tokens: 400,
    system: REAL_ESTATE_SYSTEM_PROMPT,
    messages
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta?.type === 'text_delta' &&
      chunk.delta.text
    ) {
      onEvent({ text: chunk.delta.text });
    }
  }
}

export async function streamToolChat(singleMessage, onEvent) {
  await streamAgentWithTools({
    system: REAL_ESTATE_SYSTEM_PROMPT,
    tools,
    messages: [{ role: 'user', content: singleMessage }],
    runTool: async (name, input) => runTool(name, input),
    onEvent
  });
}
