// Browser calls same-origin /backend-api/* — Next.js proxies to Railway (no CORS).
const API_PROXY = "/backend-api";

export const API_CHAT_BASE = `${API_PROXY}/api/chat`;

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
