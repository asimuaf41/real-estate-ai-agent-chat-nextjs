export const memoryTools = [
  {
    name: 'save_memory',
    description:
      'Saves important research findings, user preferences, or session summaries to long-term vector memory for future sessions.',
    input_schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description:
            'Descriptive memory to store, e.g. "User researched React 19 trends and prefers concise executive summaries"'
        },
        category: {
          type: 'string',
          enum: ['research', 'preference', 'conversation', 'project', 'personal'],
          description: 'Category of this memory'
        }
      },
      required: ['content', 'category']
    }
  },
  {
    name: 'search_memory',
    description:
      'Searches long-term memory for relevant past research or user context. Use at the start of conversations and when user references prior sessions.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Semantic search query for stored memories'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_all_memories',
    description:
      'Returns all stored memories for the user. Use when the user asks what you remember or wants full history.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'delete_memory',
    description:
      'Deletes a stored memory by ID. Use when the user asks to remove or forget a specific memory.',
    input_schema: {
      type: 'object',
      properties: {
        memory_id: {
          type: 'number',
          description: 'The numeric ID of the memory to delete'
        }
      },
      required: ['memory_id']
    }
  }
];
