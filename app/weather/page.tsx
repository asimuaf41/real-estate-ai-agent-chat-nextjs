import type { Metadata } from "next";
import { AssistantChat } from "@/components/chat/AssistantChat";
import { weatherAssistant } from "@/config/assistants";

export const metadata: Metadata = {
  title: weatherAssistant.title,
  description: weatherAssistant.description,
};

export default function WeatherPage() {
  return <AssistantChat config={weatherAssistant} toolRenderer="weather" />;
}
