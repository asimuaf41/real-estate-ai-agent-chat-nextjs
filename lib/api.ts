// Same-origin by default so Next.js rewrites proxy to the backend (no CORS).
// Set NEXT_PUBLIC_API_BASE_URL only when calling the backend directly.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";

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
