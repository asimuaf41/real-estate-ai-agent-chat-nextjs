export type MessageRole = "user" | "assistant";

export type ToolEvent = {
  type: "tool_use" | "tool_result";
  tool: string;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type ChatMessage = {
  role: MessageRole;
  content: string;
  toolEvents?: ToolEvent[];
};

export type StreamEvent = {
  text?: string;
  done?: boolean;
  error?: string;
  type?: "tool_use" | "tool_result";
  tool?: string;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
};

export type RequestMode = "messages" | "message";

export type AssistantTheme = {
  pageBackground: string;
  shellBorder: string;
  headerBackground: string;
  headerEyebrow: string;
  headerDescription: string;
  accentText: string;
  accentBorder: string;
  accentRing: string;
  accentGradient: string;
  accentShadow: string;
  userBubble: string;
  assistantBubble: string;
  emptyStateHover: string;
  chipHover: string;
  inputFocus: string;
};

export type AssistantConfig = {
  id: string;
  path: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  submitLabel: string;
  streamingLabel: string;
  apiUrl: string;
  requestMode: RequestMode;
  quickPrompts: string[];
  theme: AssistantTheme;
  supportsTools: boolean;
  errorMessage: string;
};
