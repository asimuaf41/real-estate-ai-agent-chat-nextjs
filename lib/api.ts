const FALLBACK_API_BASE = "http://localhost:3001";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? FALLBACK_API_BASE;

export const API_CHAT_BASE = `${API_BASE_URL}/api/chat`;

export const apiEndpoints = {
  realEstateChat: `${API_CHAT_BASE}/real-estate`,
  realEstateDocuments: `${API_CHAT_BASE}/real-estate/documents`,
  realEstateSeed: `${API_CHAT_BASE}/real-estate/seed`,
  webSearchChat: `${API_CHAT_BASE}/web-search`,
  webSearchMemories: `${API_CHAT_BASE}/web-search/memories`,
  weatherChat: `${API_CHAT_BASE}/weather`,
  multiAgentChat: `${API_CHAT_BASE}/multi-agent`,
  simpleChat: API_CHAT_BASE,
} as const;
