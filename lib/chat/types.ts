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

export type AccentId = "amber" | "cyan" | "violet" | "emerald";

export type AssistantTheme = {
  accent: AccentId;
};

export type PromptCard = {
  title: string;
  detail: string;
  prompt: string;
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
  promptCards?: PromptCard[];
  theme: AssistantTheme;
  supportsTools: boolean;
  errorMessage: string;
};
