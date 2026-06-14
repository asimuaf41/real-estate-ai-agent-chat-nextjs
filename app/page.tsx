import { AssistantChat } from "@/components/chat/AssistantChat";
import { webSearchAssistant } from "@/config/assistants";

export default function HomePage() {
  return (
    <AssistantChat config={webSearchAssistant} toolRenderer="web-search" />
  );
}
