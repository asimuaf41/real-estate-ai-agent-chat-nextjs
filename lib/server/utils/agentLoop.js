import { anthropicClient } from '../config/anthropic.js';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

function chunkText(text, chunkSize = 40) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function streamAgentWithTools({
  system,
  tools,
  messages,
  runTool,
  onEvent,
  model = DEFAULT_MODEL,
  maxTokens = 600,
  shouldAbort
}) {
  const conversation = [...messages];

  while (true) {
    if (shouldAbort?.()) {
      return;
    }

    const response = await anthropicClient.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      tools,
      messages: conversation
    });

    if (response.stop_reason === 'end_turn') {
      const finalText = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      for (const textChunk of chunkText(finalText)) {
        if (shouldAbort?.()) return;
        onEvent({ text: textChunk });
      }
      return;
    }

    if (response.stop_reason === 'tool_use') {
      conversation.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const block of response.content.filter((b) => b.type === 'tool_use')) {
        if (shouldAbort?.()) return;

        onEvent({
          type: 'tool_use',
          tool: block.name,
          input: block.input
        });

        let result;
        let isError = false;

        try {
          result = await runTool(block.name, block.input);
        } catch (error) {
          isError = true;
          result = {
            success: false,
            error: error?.message || 'Tool execution failed'
          };
        }

        onEvent({
          type: 'tool_result',
          tool: block.name,
          result,
          isError
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
          is_error: isError
        });
      }

      conversation.push({ role: 'user', content: toolResults });
      continue;
    }

    throw new Error(`Unexpected agent stop reason: ${response.stop_reason}`);
  }
}
