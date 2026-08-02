import { requireSupabase } from '../config/supabase.js';
import { generateEmbedding } from './embeddings.service.js';

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 50;
const DEFAULT_MATCH_THRESHOLD = 0.1;
const DEFAULT_MATCH_COUNT = 4;
const CHUNK_PREVIEW_LENGTH = 220;

function formatSupabaseError(error) {
  if (error?.message?.includes('row-level security')) {
    return (
      'Supabase RLS blocked this operation. Add SUPABASE_SERVICE_ROLE_KEY to .env.local ' +
      'or configure RLS policies in the Supabase SQL editor.'
    );
  }

  return error?.message || 'Database operation failed';
}

/**
 * Splits text into overlapping word chunks for embedding.
 */
export function chunkText(
  text,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP
) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const chunks = [];
  const stride = Math.max(chunkSize - overlap, 1);

  for (let i = 0; i < words.length; i += stride) {
    const chunk = words.slice(i, i + chunkSize).join(' ');

    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }

    if (i + chunkSize >= words.length) break;
  }

  return chunks;
}

/**
 * Internal helper: embeds an array of pre-split text segments and inserts
 * them into the `documents` table.
 */
async function insertEmbeddedChunks(sourceFile, segments, metadata) {
  const supabase = requireSupabase();
  const cleanSegments = segments
    .map((segment) => String(segment || '').trim())
    .filter((segment) => segment.length > 0);

  if (cleanSegments.length === 0) {
    return { sourceFile, chunkCount: 0, chunks: [] };
  }

  const rows = await Promise.all(
    cleanSegments.map(async (content, chunkIndex) => ({
      source_file: sourceFile,
      chunk_index: chunkIndex,
      content,
      embedding: await generateEmbedding(content),
      metadata
    }))
  );

  const { data, error } = await supabase
    .from('documents')
    .insert(rows)
    .select('id, source_file, chunk_index, metadata, created_at');

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return {
    sourceFile,
    chunkCount: data?.length ?? 0,
    chunks: data ?? []
  };
}

/**
 * Splits a document into chunks, embeds each, and stores them in Supabase.
 */
export async function ingestDocument(
  sourceFile,
  fullText,
  extraMetadata = {},
  options = {}
) {
  const chunks = chunkText(
    fullText,
    options.chunkSize ?? DEFAULT_CHUNK_SIZE,
    options.overlap ?? DEFAULT_CHUNK_OVERLAP
  );

  return insertEmbeddedChunks(sourceFile, chunks, extraMetadata);
}

/**
 * Embeds and stores pre-split segments without re-chunking. Use when the
 * caller already knows the ideal chunk boundaries (e.g. one listing each).
 */
export async function ingestSegments(
  sourceFile,
  segments,
  extraMetadata = {}
) {
  return insertEmbeddedChunks(sourceFile, segments, extraMetadata);
}

/**
 * pgvector returns the embedding column either as a JS array or as a
 * stringified vector ("[0.1,0.2,...]"). Normalize both to number[].
 */
function parseEmbedding(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  return [];
}

function cosineSimilarity(a, b) {
  if (!a.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fallback retrieval that computes cosine similarity in JS over all rows.
 * Used when the match_documents RPC is unavailable or returns nothing
 * (e.g. an ivfflat index returning empty results on a small table).
 */
async function retrieveByScan(queryEmbedding, limit, threshold) {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('documents')
    .select('id, source_file, content, metadata, embedding');

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      source_file: row.source_file,
      content: row.content,
      metadata: row.metadata,
      similarity: cosineSimilarity(
        queryEmbedding,
        parseEmbedding(row.embedding)
      )
    }))
    .filter((row) => row.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Embeds the query and retrieves top-N relevant chunks. Tries the
 * match_documents RPC first, then falls back to an in-memory cosine scan
 * so retrieval is reliable regardless of the vector index configuration.
 */
export async function retrieveRelevantChunks(
  query,
  limit = DEFAULT_MATCH_COUNT,
  threshold = DEFAULT_MATCH_THRESHOLD
) {
  const supabase = requireSupabase();
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit
  });

  if (error) {
    console.warn(
      `[rag] match_documents RPC failed (${error.message}); using JS scan fallback`
    );
    return retrieveByScan(embedding, limit, threshold);
  }

  if (Array.isArray(data) && data.length > 0) {
    return data;
  }

  console.warn(
    '[rag] match_documents returned 0 rows; using JS scan fallback'
  );
  return retrieveByScan(embedding, limit, threshold);
}

/**
 * Returns one row per source_file with chunk count, metadata, and a short
 * preview of the first chunk's content.
 */
export async function listDocuments() {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('documents')
    .select('id, source_file, chunk_index, content, metadata, created_at')
    .order('chunk_index', { ascending: true });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const grouped = new Map();

  for (const row of data ?? []) {
    const existing = grouped.get(row.source_file);

    if (!existing) {
      grouped.set(row.source_file, {
        sourceFile: row.source_file,
        chunkCount: 1,
        metadata: row.metadata,
        createdAt: row.created_at,
        preview: (row.content ?? '').slice(0, CHUNK_PREVIEW_LENGTH)
      });
      continue;
    }

    existing.chunkCount += 1;

    if (row.created_at < existing.createdAt) {
      existing.createdAt = row.created_at;
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function countDocuments() {
  const supabase = requireSupabase();

  const { count, error } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return count ?? 0;
}

export async function deleteDocument(sourceFile) {
  const supabase = requireSupabase();

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('source_file', sourceFile);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return { success: true, sourceFile };
}
