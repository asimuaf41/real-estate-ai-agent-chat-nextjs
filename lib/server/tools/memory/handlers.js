import {
  deleteMemory,
  getAllMemories,
  saveMemory,
  searchMemories
} from '../../services/memory.service.js';

const ANONYMOUS_USER_ID = 'anonymous';

function isAnonymousUser(userId) {
  return !userId || userId === ANONYMOUS_USER_ID;
}

/**
 * Memory tools are durable only for authenticated users.
 * Guests (anonymous) get soft no-ops so free demos don't write shared long-term memory.
 */
export function createMemoryToolRunner(userId) {
  return async function runMemoryTool(toolName, toolInput) {
    if (isAnonymousUser(userId)) {
      switch (toolName) {
        case 'save_memory':
          return {
            success: false,
            skipped: true,
            message:
              'Sign in to save memories permanently to your account.'
          };
        case 'search_memory':
          return {
            found: 0,
            message: 'Sign in to search your saved memories.'
          };
        case 'get_all_memories':
          return { total: 0, memories: [] };
        case 'delete_memory':
          return {
            success: false,
            skipped: true,
            message: 'Sign in to manage saved memories.'
          };
        default:
          throw new Error(`Unsupported memory tool: ${toolName}`);
      }
    }

    switch (toolName) {
      case 'save_memory': {
        const saved = await saveMemory(userId, toolInput.content, {
          category: toolInput.category
        });

        return {
          success: true,
          message: 'Memory saved successfully',
          memory: {
            id: saved.id,
            content: saved.content,
            category: saved.metadata?.category,
            date: saved.created_at
          }
        };
      }

      case 'search_memory': {
        const memories = await searchMemories(userId, toolInput.query);

        if (memories.length === 0) {
          return { found: 0, message: 'No relevant memories found' };
        }

        return {
          found: memories.length,
          memories: memories.map((memory) => ({
            id: memory.id,
            content: memory.content,
            category: memory.metadata?.category,
            similarity: `${Math.round((memory.similarity ?? 0) * 100)}%`,
            date: memory.created_at
          }))
        };
      }

      case 'get_all_memories': {
        const memories = await getAllMemories(userId);

        return {
          total: memories.length,
          memories: memories.map((memory) => ({
            id: memory.id,
            content: memory.content,
            category: memory.metadata?.category,
            date: memory.created_at
          }))
        };
      }

      case 'delete_memory': {
        await deleteMemory(userId, toolInput.memory_id);
        return {
          success: true,
          message: `Memory ${toolInput.memory_id} deleted`
        };
      }

      default:
        throw new Error(`Unsupported memory tool: ${toolName}`);
    }
  };
}
