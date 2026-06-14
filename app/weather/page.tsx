import { AssistantChat } from "@/components/chat/AssistantChat";
import { weatherAssistant } from "@/config/assistants";

export default function WeatherPage() {
  return <AssistantChat config={weatherAssistant} toolRenderer="weather" />;
}
