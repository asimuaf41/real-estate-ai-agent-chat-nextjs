import { env } from '../config/env.js';

const SEARCH_ENDPOINT = 'https://api.tavily.com/search';
const EXTRACT_ENDPOINT = 'https://api.tavily.com/extract';

function requireTavilyKey() {
  if (!env.tavilyApiKey) {
    throw new Error('TAVILY_API_KEY is not configured');
  }
  return env.tavilyApiKey;
}

export async function searchWeb(query, maxResults = 5) {
  const apiKey = requireTavilyKey();

  const response = await fetch(SEARCH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: Math.min(maxResults, 10),
      search_depth: 'advanced',
      include_answer: true
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Tavily search failed (${response.status})`);
  }

  const results = (data.results ?? []).map((result) => ({
    title: result.title,
    url: result.url,
    snippet: result.content?.substring(0, 300) ?? ''
  }));

  return {
    query,
    answer: data.answer ?? null,
    results
  };
}

export async function readUrl(url) {
  const apiKey = requireTavilyKey();

  const response = await fetch(EXTRACT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      urls: [url]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Tavily extract failed (${response.status})`);
  }

  const content = data.results?.[0]?.raw_content ?? 'Could not read this page';

  return {
    url,
    content: content.substring(0, 2000)
  };
}
