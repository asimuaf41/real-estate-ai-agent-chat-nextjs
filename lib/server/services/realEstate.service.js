import { anthropicClient } from '../config/anthropic.js';
import { buildRealEstateRagPrompt } from '../prompts/realEstateRagPrompt.js';
import {
  ATLANTA_PROPERTIES_METADATA,
  ATLANTA_PROPERTIES_SOURCE,
  ATLANTA_PROPERTY_LISTINGS
} from '../data/atlanta-properties.js';
import {
  countDocuments,
  deleteDocument,
  ingestSegments,
  retrieveRelevantChunks
} from './rag.service.js';

const CHAT_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;
const MATCH_COUNT = 5;
const MATCH_THRESHOLD = 0.1;
const SNIPPET_LENGTH = 240;

function getLatestUserQuery(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') {
      const content = messages[i].content;
      if (typeof content === 'string') return content;
    }
  }
  return '';
}

function summarizeChunk(chunk) {
  return {
    id: chunk.id,
    sourceFile: chunk.source_file,
    similarity: Math.round((chunk.similarity ?? 0) * 100) / 100,
    snippet: (chunk.content ?? '').slice(0, SNIPPET_LENGTH)
  };
}

/**
 * Splits the Atlanta listings text into one segment per "PROPERTY LISTING #N"
 * block so retrieval can match on individual properties instead of one blob.
 */
function splitPropertyListings(text) {
  return String(text)
    .split(/\n\s*\n(?=PROPERTY LISTING)/g)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

export async function streamRealEstateChat(messages, onEvent) {
  const query = getLatestUserQuery(messages);

  if (!query.trim()) {
    onEvent({
      text: 'Please ask a question about Atlanta properties.'
    });
    return;
  }

  onEvent({
    type: 'tool_use',
    tool: 'retrieve_properties',
    input: { query }
  });

  let chunks = [];
  try {
    chunks = await retrieveRelevantChunks(query, MATCH_COUNT, MATCH_THRESHOLD);
  } catch (error) {
    console.error('[real-estate] retrieval failed:', error);
    onEvent({
      type: 'tool_result',
      tool: 'retrieve_properties',
      result: {
        query,
        count: 0,
        chunks: [],
        error: error.message
      },
      isError: true
    });
    throw error;
  }

  console.log(
    `[real-estate] retrieved ${chunks.length} chunk(s) for "${query}"`,
    chunks.map((c) => ({
      id: c.id,
      source: c.source_file,
      similarity: c.similarity
    }))
  );

  onEvent({
    type: 'tool_result',
    tool: 'retrieve_properties',
    result: {
      query,
      count: chunks.length,
      chunks: chunks.map(summarizeChunk)
    }
  });

  const context = chunks.map((chunk) => chunk.content).join('\n\n---\n\n');
  const system = buildRealEstateRagPrompt(context);

  const stream = await anthropicClient.messages.stream({
    model: CHAT_MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta?.type === 'text_delta' &&
      event.delta.text
    ) {
      onEvent({ text: event.delta.text });
    }
  }
}

/**
 * Seeds the Atlanta property listings as one chunk per listing.
 * Skips ingestion when documents already exist unless `force` is true,
 * in which case existing rows for the same source file are removed first.
 */
export async function seedAtlantaProperties({ force = false } = {}) {
  const existing = await countDocuments();

  if (existing > 0 && !force) {
    return {
      seeded: false,
      skipped: true,
      message: `Database already contains ${existing} document chunk(s). Click Re-seed to replace.`,
      chunkCount: existing,
      sourceFile: ATLANTA_PROPERTIES_SOURCE
    };
  }

  if (force) {
    await deleteDocument(ATLANTA_PROPERTIES_SOURCE).catch((error) => {
      console.warn('[real-estate] re-seed delete warning:', error.message);
    });
  }

  const listings = splitPropertyListings(ATLANTA_PROPERTY_LISTINGS);
  console.log(
    `[real-estate] ingesting ${listings.length} property listing chunk(s)`
  );

  const result = await ingestSegments(
    ATLANTA_PROPERTIES_SOURCE,
    listings,
    ATLANTA_PROPERTIES_METADATA
  );

  console.log(
    `[real-estate] seeded ${result.chunkCount} chunk(s) for ${result.sourceFile}`
  );

  return {
    seeded: true,
    skipped: false,
    message: `Ingested ${result.chunkCount} property chunk(s) for ${result.sourceFile}.`,
    chunkCount: result.chunkCount,
    sourceFile: result.sourceFile
  };
}
