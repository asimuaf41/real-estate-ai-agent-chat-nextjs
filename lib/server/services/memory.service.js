import { requireSupabase } from '../config/supabase.js';
import { generateEmbedding } from './embeddings.service.js';

const MATCH_THRESHOLD = 0.45;
const MATCH_COUNT = 5;

function formatSupabaseError(error) {
  if (error?.message?.includes('row-level security')) {
    return (
      'Supabase RLS blocked this operation. Add SUPABASE_SERVICE_ROLE_KEY to .env.local ' +
      'or configure RLS policies in the Supabase SQL editor.'
    );
  }

  return error?.message || 'Database operation failed';
}

export async function saveMemory(userId, content, metadata = {}) {
  const supabase = requireSupabase();
  const embedding = await generateEmbedding(content);

  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      content,
      embedding,
      metadata
    })
    .select('id, content, metadata, created_at')
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return data;
}

export async function searchMemories(userId, query) {
  const supabase = requireSupabase();
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: embedding,
    match_user_id: userId,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT
  });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return data ?? [];
}

export async function getAllMemories(userId) {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('memories')
    .select('id, content, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return data ?? [];
}

export async function deleteMemory(userId, memoryId) {
  const supabase = requireSupabase();

  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', memoryId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return { success: true, id: memoryId };
}
