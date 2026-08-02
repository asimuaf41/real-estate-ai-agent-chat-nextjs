export const tools = [
  {
    name: 'calculator',
    description: 'Performs math calculations for arithmetic and percentages',
    input_schema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Math expression like "50 * 23.5"'
        }
      },
      required: ['expression']
    }
  },
  {
    name: 'get_weather',
    description: 'Gets current weather for a city',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name like "Lahore"' },
        country: { type: 'string', description: 'Country code like "US"' }
      },
      required: ['city']
    }
  },
  {
    name: 'save_note',
    description: 'Saves user notes',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short note title' },
        content: { type: 'string', description: 'Note body' }
      },
      required: ['title', 'content']
    }
  }
];
