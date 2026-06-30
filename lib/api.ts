// Same-origin proxy prefix — Next.js rewrites /backend-api/* → Railway/local backend.
// This avoids browser CORS entirely in production.
const API_PROXY_PREFIX = "/backend-api";

export const API_CHAT_BASE = `${API_PROXY_PREFIX}/api/chat`;

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
