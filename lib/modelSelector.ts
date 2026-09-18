export function selectModel(agentType: string, messageLength: number): string {
  // Very short messages are always simple
  if (messageLength < 100) {
    return "claude-haiku-4-5-20251001";
  }

  // Agent-specific model selection
  // Haiku 3.5 is retired on the first-party API; use current Haiku 4.5.
  const modelMap: Record<string, string> = {
    weather: "claude-haiku-4-5-20251001", // simple tool call
    research: "claude-sonnet-4-5-20250929", // needs reasoning
    rag: "claude-sonnet-4-5-20250929", // needs context reasoning
    "multi-agent": "claude-sonnet-4-5-20250929", // complex orchestration
  };

  return modelMap[agentType] || "claude-sonnet-4-5-20250929";
}
