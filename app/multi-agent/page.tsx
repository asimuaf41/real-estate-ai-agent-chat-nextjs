import { MultiAgentChat } from "@/components/chat/MultiAgentChat";
import { multiAgentAssistant } from "@/config/assistants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: multiAgentAssistant.title,
  description: multiAgentAssistant.description,
};

/** Alias of `/` — same multi-agent desk for existing links and bookmarks. */
export default function MultiAgentPage() {
  return <MultiAgentChat />;
}
