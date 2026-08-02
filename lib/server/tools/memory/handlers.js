import {
  deleteMemory,
  getAllMemories,
  saveMemory,
  searchMemories
} from '../../services/memory.service.js';

export function createMemoryToolRunner(userId) {
  return async function runMemoryTool(toolName, toolInput) {
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
