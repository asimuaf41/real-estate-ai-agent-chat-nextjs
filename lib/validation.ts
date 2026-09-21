export type ValidationResult = {
  valid: boolean;
  error?: string;
};

export const MAX_MESSAGE_LENGTH = 2000;

export const AGENT_TYPES = ["weather", "research", "rag", "multi-agent"] as const;
export type AgentType = (typeof AGENT_TYPES)[number];

export function validateMessage(input: unknown): ValidationResult {
  if (typeof input !== "string") {
    return { valid: false, error: "Message must be a string" };
  }

  const message = input.trim();

  if (!message) {
    return { valid: false, error: "Message cannot be empty" };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
    };
  }

  return { valid: true };
}

export function validateUserId(input: unknown): ValidationResult {
  if (typeof input !== "string" || !input.trim()) {
    return { valid: false, error: "User ID must be a non-empty string" };
  }

  return { valid: true };
}

export function validateAgentType(input: unknown): ValidationResult {
  if (typeof input !== "string") {
    return { valid: false, error: "Agent type must be a string" };
  }

  if (!AGENT_TYPES.includes(input as AgentType)) {
    return {
      valid: false,
      error: "Agent type must be one of: weather, research, rag, multi-agent",
    };
  }

  return { valid: true };
}

export function sanitizeInput(
  input: unknown,
): ValidationResult & { value?: string } {
  if (typeof input !== "string") {
    return { valid: false, error: "Input must be a string" };
  }

  return { valid: true, value: stripHtmlTags(input).trim() };
}

function stripHtmlTags(value: string): string {
  let previous = "";
  let current = value;

  // Repeat so nested/malformed tags like <<b>hi</b> cannot survive one pass.
  while (current !== previous) {
    previous = current;
    current = current.replace(/<[^>]*>/g, "");
  }

  return current;
}
