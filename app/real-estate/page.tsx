import { AssistantChat } from "@/components/chat/AssistantChat";
import { realEstateAssistant } from "@/config/assistants";

export default function RealEstatePage() {
  return <AssistantChat config={realEstateAssistant} />;
}
