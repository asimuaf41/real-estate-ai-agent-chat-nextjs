export function createTokenUsage(model) {
  return {
    model,
    inputTokens: 0,
    outputTokens: 0,
  };
}

/** Add Anthropic `usage` (`input_tokens` / `output_tokens`) onto a running total. */
export function addAnthropicUsage(totals, usage) {
  if (!totals || !usage) {
    return totals;
  }

  totals.inputTokens += Number(usage.input_tokens) || 0;
  totals.outputTokens += Number(usage.output_tokens) || 0;
  return totals;
}

export async function collectStreamUsage(stream, totals) {
  try {
    const finalMessage = await stream.finalMessage();
    addAnthropicUsage(totals, finalMessage?.usage);
    if (totals && finalMessage?.model) {
      totals.model = finalMessage.model;
    }
  } catch {
    // Incomplete stream — keep whatever was already recorded.
  }
}
