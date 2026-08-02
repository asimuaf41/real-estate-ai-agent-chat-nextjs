import { anthropicClient } from '../../config/anthropic.js';
import {
  ANALYSIS_AGENT_PROMPT,
  DATABASE_AGENT_PROMPT,
  PREFERENCE_AGENT_PROMPT,
  RESEARCH_AGENT_PROMPT,
  WRITER_AGENT_PROMPT
} from '../../prompts/multiAgentPrompts.js';
import { retrieveRelevantChunks } from '../rag.service.js';
import { searchMemories } from '../memory.service.js';
import { searchWeb } from '../tavily.service.js';

const AGENT_MODEL = 'claude-haiku-4-5-20251001';

async function complete({ system, prompt, maxTokens = 800 }) {
  const response = await anthropicClient.messages.create({
    model: AGENT_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

/**
 * AGENT 1 — User Preference Agent.
 * Uses long-term memory (searchMemories) to personalize the report.
 */
export async function userPreferenceAgent(userId) {
  let memories = [];

  try {
    memories = await searchMemories(
      userId,
      'user real estate preferences budget location bedrooms property type'
    );
  } catch (error) {
    return {
      summary: 'No saved preferences found.',
      memoryCount: 0,
      note: `Memory lookup unavailable: ${error.message}`
    };
  }

  if (!memories.length) {
    return { summary: 'No saved preferences found.', memoryCount: 0 };
  }

  const snippets = memories
    .map((memory, index) => `${index + 1}. ${memory.content}`)
    .join('\n');

  const summary = await complete({
    system: PREFERENCE_AGENT_PROMPT,
    prompt: `Saved memory snippets for this user:\n${snippets}`,
    maxTokens: 400
  });

  return { summary, memoryCount: memories.length };
}

/**
 * AGENT 2 — Research Agent. Web search (Tavily) + summarization.
 */
export async function researchAgent(topic) {
  const search = await searchWeb(topic, 5);

  const summary = await complete({
    system: RESEARCH_AGENT_PROMPT,
    prompt: `Topic: ${topic}\n\nSearch Results:\n${JSON.stringify(search.results, null, 2)}\n\nProvide a structured summary with key findings.`,
    maxTokens: 800
  });

  return {
    summary,
    sources: search.results.map((result) => ({
      title: result.title,
      url: result.url
    }))
  };
}

/**
 * AGENT 3 — Database Agent. RAG retrieval over the property database.
 */
export async function databaseAgent(query, limit = 5) {
  const chunks = await retrieveRelevantChunks(query, limit);

  if (!chunks.length) {
    return {
      summary: 'No relevant property data found in the database.',
      matchCount: 0
    };
  }

  const context = chunks.map((chunk) => chunk.content).join('\n\n');

  const summary = await complete({
    system: DATABASE_AGENT_PROMPT,
    prompt: `Query: ${query}\n\nDatabase Content:\n${context}\n\nExtract all relevant property information.`,
    maxTokens: 900
  });

  return {
    summary,
    matchCount: chunks.length,
    matches: chunks.map((chunk) => ({
      sourceFile: chunk.source_file,
      similarity: Math.round((chunk.similarity ?? 0) * 100) / 100
    }))
  };
}

/**
 * AGENT 4 — Analysis Agent. Scores and compares using criteria + preferences.
 */
export async function analysisAgent(combinedData, criteria, preferences) {
  const summary = await complete({
    system: ANALYSIS_AGENT_PROMPT,
    prompt: `Criteria: ${criteria}

User Preferences:
${preferences || 'None provided.'}

Data to Analyze:
${combinedData}

Provide a structured analysis with scores (1-10) and clear recommendations.`,
    maxTokens: 1000
  });

  return { summary };
}

/**
 * AGENT 5 — Writer Agent. Produces the final personalized markdown report.
 */
export async function writerAgent({
  topic,
  preferences,
  researchData,
  databaseData,
  analysisData
}) {
  return complete({
    system: WRITER_AGENT_PROMPT,
    prompt: `Create a professional real estate report on: ${topic}

USER PREFERENCES (personalize for this):
${preferences || 'No specific preferences provided.'}

MARKET RESEARCH:
${researchData}

AVAILABLE PROPERTIES:
${databaseData}

ANALYSIS & RECOMMENDATIONS:
${analysisData}

Write the complete report now.`,
    maxTokens: 2000
  });
}
