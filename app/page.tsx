import { MultiAgentChat } from "@/components/chat/MultiAgentChat";
import { multiAgentAssistant } from "@/config/assistants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${multiAgentAssistant.title} · AI Agent Workspace`,
  description: multiAgentAssistant.description,
};

export default function HomePage() {
  return <MultiAgentChat />;
}
