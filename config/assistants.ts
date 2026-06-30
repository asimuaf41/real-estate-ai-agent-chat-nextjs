import { apiEndpoints } from "@/lib/api";
import type { AssistantConfig } from "@/lib/chat/types";

export const webSearchAssistant: AssistantConfig = {
  id: "web-search",
  path: "/",
  label: "Web Search",
  eyebrow: "Research Intelligence",
  title: "Web Search Assistant",
  description:
    "Search the web, discover video resources, read sources, and export research reports.",
  placeholder:
    "Research a topic, find videos, read articles, or save a report...",
  submitLabel: "Send",
  streamingLabel: "Researching...",
  apiUrl: apiEndpoints.webSearchChat,
  requestMode: "messages",
  supportsTools: true,
  errorMessage:
    "Could not reach the research server. Check if port 3001 is running.",
  quickPrompts: [
    "Research the latest trends in React and Next.js development in 2025.",
    "Find YouTube tutorials on building AI agents with Claude.",
    "What are the best practices for RAG systems? Search and summarize.",
    "Research TypeScript 5 features and save the report.",
  ],
  theme: {
    pageBackground:
      "bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_40%),linear-gradient(180deg,#070b14_0%,#0b1220_45%,#070b14_100%)]",
    shellBorder: "border-amber-500/15",
    headerBackground:
      "bg-linear-to-r from-[#1a1408] via-[#141820] to-[#1a1020] border-b border-white/10",
    headerEyebrow: "text-amber-300/80",
    headerDescription: "text-zinc-400",
    accentText: "text-amber-300",
    accentBorder: "border-amber-500/30",
    accentRing: "focus:ring-amber-500/20 focus:border-amber-400/50",
    accentGradient: "from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400",
    accentShadow: "shadow-amber-500/20",
    userBubble: "bg-linear-to-br from-amber-600 to-orange-600 text-white",
    assistantBubble: "border border-white/10 bg-zinc-900/80 text-zinc-100",
    emptyStateHover: "hover:border-amber-500/30 hover:bg-amber-500/5",
    chipHover: "hover:border-amber-500/30 hover:text-amber-200",
    inputFocus: "focus:ring-amber-500/20 focus:border-amber-400/40",
  },
};

export const realEstateAssistant: AssistantConfig = {
  id: "real-estate",
  path: "/real-estate",
  label: "Real Estate",
  eyebrow: "Property Intelligence (RAG)",
  title: "Real Estate Assistant",
  description:
    "Ask questions about the Atlanta property database. Answers cite indexed listings retrieved with vector search.",
  placeholder:
    "Ask about Buckhead listings, prices under $400k, pools, schools...",
  submitLabel: "Ask",
  streamingLabel: "Retrieving...",
  apiUrl: apiEndpoints.realEstateChat,
  requestMode: "messages",
  supportsTools: true,
  errorMessage:
    "Could not reach the real estate server. Check if port 3001 is running.",
  quickPrompts: [
    "What properties do you have in Buckhead?",
    "I have a budget of $400,000, what can I afford?",
    "Do you have anything with a pool?",
    "Tell me about properties built after 2015.",
  ],
  theme: {
    pageBackground:
      "bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_40%),linear-gradient(180deg,#070b14_0%,#0b1220_45%,#070b14_100%)]",
    shellBorder: "border-cyan-500/15",
    headerBackground:
      "bg-linear-to-r from-[#081420] via-[#101820] to-[#081820] border-b border-white/10",
    headerEyebrow: "text-cyan-300/80",
    headerDescription: "text-zinc-400",
    accentText: "text-cyan-300",
    accentBorder: "border-cyan-500/30",
    accentRing: "focus:ring-cyan-500/20 focus:border-cyan-400/50",
    accentGradient: "from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400",
    accentShadow: "shadow-cyan-500/20",
    userBubble: "bg-linear-to-br from-cyan-600 to-sky-600 text-white",
    assistantBubble: "border border-white/10 bg-zinc-900/80 text-zinc-100",
    emptyStateHover: "hover:border-cyan-500/30 hover:bg-cyan-500/5",
    chipHover: "hover:border-cyan-500/30 hover:text-cyan-200",
    inputFocus: "focus:ring-cyan-500/20 focus:border-cyan-400/40",
  },
};

export const weatherAssistant: AssistantConfig = {
  id: "weather",
  path: "/weather",
  label: "Weather",
  eyebrow: "Climate Intelligence",
  title: "Weather Assistant",
  description:
    "Get live weather conditions, save reports, and retrieve your saved weather history.",
  placeholder:
    "Ask about weather in any city, save a report, or list saved reports...",
  submitLabel: "Send",
  streamingLabel: "Streaming...",
  apiUrl: apiEndpoints.weatherChat,
  requestMode: "message",
  supportsTools: true,
  errorMessage:
    "Could not reach the weather server. Check if port 3001 is running.",
  quickPrompts: [
    "What is the weather in Dubai right now?",
    "Check the weather in Lahore and save it as a report.",
    "Show me all my saved weather reports.",
    "Get weather for Atlanta and save the report.",
  ],
  theme: {
    pageBackground:
      "bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.14),_transparent_40%),linear-gradient(180deg,#070b14_0%,#0b1220_45%,#070b14_100%)]",
    shellBorder: "border-violet-500/15",
    headerBackground:
      "bg-linear-to-r from-[#120f20] via-[#141820] to-[#181028] border-b border-white/10",
    headerEyebrow: "text-violet-300/80",
    headerDescription: "text-zinc-400",
    accentText: "text-violet-300",
    accentBorder: "border-violet-500/30",
    accentRing: "focus:ring-violet-500/20 focus:border-violet-400/50",
    accentGradient: "from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400",
    accentShadow: "shadow-violet-500/20",
    userBubble: "bg-linear-to-br from-violet-600 to-purple-600 text-white",
    assistantBubble: "border border-white/10 bg-zinc-900/80 text-zinc-100",
    emptyStateHover: "hover:border-violet-500/30 hover:bg-violet-500/5",
    chipHover: "hover:border-violet-500/30 hover:text-violet-200",
    inputFocus: "focus:ring-violet-500/20 focus:border-violet-400/40",
  },
};

export const multiAgentAssistant: AssistantConfig = {
  id: "multi-agent",
  path: "/multi-agent",
  label: "Multi-Agent",
  eyebrow: "Orchestrated Intelligence",
  title: "Multi-Agent Research Desk",
  description:
    "An orchestrator coordinates 5 specialists — preferences, web research, property database, analysis, and report writing — to deliver a personalized, client-ready report.",
  placeholder:
    "e.g. Research the Atlanta market, analyze our top 5 properties, write a report, and email it to the client...",
  submitLabel: "Run Agents",
  streamingLabel: "Coordinating agents...",
  apiUrl: apiEndpoints.multiAgentChat,
  requestMode: "messages",
  supportsTools: true,
  errorMessage:
    "Could not reach the multi-agent server. Check if port 3001 is running.",
  quickPrompts: [
    "Research the Atlanta real estate market, analyze the top 5 properties from our database, write a professional report, and email it to the client.",
    "Find family-friendly homes under $450k, analyze them against current market trends, and write a personalized report.",
    "Compare Buckhead vs Midtown investment potential using market data and our listings.",
    "Build an investment report for properties with a pool and email it.",
  ],
  theme: {
    pageBackground:
      "bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(180deg,#070b14_0%,#0b1220_45%,#070b14_100%)]",
    shellBorder: "border-emerald-500/15",
    headerBackground:
      "bg-linear-to-r from-[#08140f] via-[#101820] to-[#08180f] border-b border-white/10",
    headerEyebrow: "text-emerald-300/80",
    headerDescription: "text-zinc-400",
    accentText: "text-emerald-300",
    accentBorder: "border-emerald-500/30",
    accentRing: "focus:ring-emerald-500/20 focus:border-emerald-400/50",
    accentGradient:
      "from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400",
    accentShadow: "shadow-emerald-500/20",
    userBubble: "bg-linear-to-br from-emerald-600 to-teal-600 text-white",
    assistantBubble: "border border-white/10 bg-zinc-900/80 text-zinc-100",
    emptyStateHover: "hover:border-emerald-500/30 hover:bg-emerald-500/5",
    chipHover: "hover:border-emerald-500/30 hover:text-emerald-200",
    inputFocus: "focus:ring-emerald-500/20 focus:border-emerald-400/40",
  },
};

export const assistants = [
  webSearchAssistant,
  realEstateAssistant,
  weatherAssistant,
  multiAgentAssistant,
] as const;
