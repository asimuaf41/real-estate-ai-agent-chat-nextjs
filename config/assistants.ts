import { apiEndpoints } from "@/lib/api";
import type { AssistantConfig } from "@/lib/chat/types";

export const webSearchAssistant: AssistantConfig = {
  id: "web-search",
  path: "/web-search",
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
    "Research the latest trends in React and Next.js development in 2026.",
    "Find YouTube tutorials on building AI agents with Claude.",
    "What are the best practices for RAG systems? Search and summarize.",
    "Research TypeScript 5 features and save the report.",
  ],
  promptCards: [
    {
      title: "React & Next.js trends",
      detail: "Research current frameworks and summarize the landscape.",
      prompt:
        "Research the latest trends in React and Next.js development in 2026.",
    },
    {
      title: "AI agent tutorials",
      detail: "Find YouTube videos on building agents with Claude.",
      prompt: "Find YouTube tutorials on building AI agents with Claude.",
    },
    {
      title: "RAG best practices",
      detail: "Search and summarize retrieval-augmented generation guidance.",
      prompt:
        "What are the best practices for RAG systems? Search and summarize.",
    },
    {
      title: "TypeScript 5 report",
      detail: "Research features and save a markdown report.",
      prompt: "Research TypeScript 5 features and save the report.",
    },
  ],
  theme: {
    accent: "amber",
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
  promptCards: [
    {
      title: "Buckhead listings",
      detail: "Ask what’s available in Buckhead right now.",
      prompt: "What properties do you have in Buckhead?",
    },
    {
      title: "Under $400k",
      detail: "Match budget to indexed Atlanta inventory.",
      prompt: "I have a budget of $400,000, what can I afford?",
    },
    {
      title: "Homes with a pool",
      detail: "Filter the property database for pools.",
      prompt: "Do you have anything with a pool?",
    },
    {
      title: "Built after 2015",
      detail: "Find newer construction in the RAG index.",
      prompt: "Tell me about properties built after 2015.",
    },
  ],
  theme: {
    accent: "cyan",
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
  promptCards: [
    {
      title: "Dubai conditions",
      detail: "Live weather for Dubai right now.",
      prompt: "What is the weather in Dubai right now?",
    },
    {
      title: "Lahore + save",
      detail: "Fetch weather and store it as a report.",
      prompt: "Check the weather in Lahore and save it as a report.",
    },
    {
      title: "Saved reports",
      detail: "List weather reports you’ve saved.",
      prompt: "Show me all my saved weather reports.",
    },
    {
      title: "Atlanta report",
      detail: "Get Atlanta weather and export a report.",
      prompt: "Get weather for Atlanta and save the report.",
    },
  ],
  theme: {
    accent: "violet",
  },
};

export const multiAgentAssistant: AssistantConfig = {
  id: "multi-agent",
  path: "/",
  label: "Multi-Agent",
  eyebrow: "Orchestrated Intelligence",
  title: "Multi-Agent Desk",
  description:
    "Coordinate specialists for research, listings, analysis, and a client-ready report.",
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
  promptCards: [
    {
      title: "Atlanta market brief",
      detail: "Research, analyze top listings, write and email a client report.",
      prompt:
        "Research the Atlanta real estate market, analyze the top 5 properties from our database, write a professional report, and email it to the client.",
    },
    {
      title: "Family homes under $450k",
      detail: "Match preferences to listings and return a personalized brief.",
      prompt:
        "Find family-friendly homes under $450k, analyze them against current market trends, and write a personalized report.",
    },
    {
      title: "Buckhead vs Midtown",
      detail: "Compare investment potential with market data and listings.",
      prompt:
        "Compare Buckhead vs Midtown investment potential using market data and our listings.",
    },
    {
      title: "Pool property report",
      detail: "Build an investment brief for pool listings and email it.",
      prompt: "Build an investment report for properties with a pool and email it.",
    },
  ],
  theme: {
    accent: "emerald",
  },
};

export const assistants = [
  multiAgentAssistant,
  webSearchAssistant,
  realEstateAssistant,
  weatherAssistant,
] as const;
