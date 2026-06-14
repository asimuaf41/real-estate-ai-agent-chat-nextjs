import type { AssistantConfig } from "@/lib/chat/types";

const API_BASE = "http://localhost:3001/api/chat";

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
  apiUrl: `${API_BASE}/web-search`,
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
  eyebrow: "Property Intelligence",
  title: "Real Estate Assistant",
  description:
    "Explore listings, compare neighborhoods, and get investment guidance for smarter property decisions.",
  placeholder:
    "Ask about property prices, nearby schools, investment ROI...",
  submitLabel: "Send",
  streamingLabel: "Streaming...",
  apiUrl: API_BASE,
  requestMode: "messages",
  supportsTools: false,
  errorMessage:
    "Could not reach your AI server. Check if port 3001 is running.",
  quickPrompts: [
    "Show me 3 modern apartments under $500k in downtown.",
    "Find family-friendly homes with a backyard near top schools.",
    "Compare two-bedroom condos with low HOA fees.",
    "Give me an investment property analysis for rental yield.",
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
  apiUrl: `${API_BASE}/weather`,
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

export const assistants = [
  webSearchAssistant,
  realEstateAssistant,
  weatherAssistant,
] as const;
