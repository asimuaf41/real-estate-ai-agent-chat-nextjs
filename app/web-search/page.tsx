import type { Metadata } from "next";
import { WebSearchChat } from "@/components/chat/WebSearchChat";
import { webSearchAssistant } from "@/config/assistants";

export const metadata: Metadata = {
  title: webSearchAssistant.title,
  description: webSearchAssistant.description,
};

export default function WebSearchPage() {
  return <WebSearchChat />;
}
