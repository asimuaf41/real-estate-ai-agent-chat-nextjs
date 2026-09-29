import { MultiAgentChat } from "@/components/chat/MultiAgentChat";
import { multiAgentAssistant } from "@/config/assistants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: multiAgentAssistant.title,
  description: multiAgentAssistant.description,
};

export default function HomePage() {
  return <MultiAgentChat />;
}
