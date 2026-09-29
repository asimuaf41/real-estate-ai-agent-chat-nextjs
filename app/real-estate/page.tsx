import type { Metadata } from "next";
import { RealEstateChat } from "@/components/chat/RealEstateChat";
import { realEstateAssistant } from "@/config/assistants";

export const metadata: Metadata = {
  title: realEstateAssistant.title,
  description: realEstateAssistant.description,
};

export default function RealEstatePage() {
  return <RealEstateChat />;
}
