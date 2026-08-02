export const weatherTools = [
  {
    name: 'get_weather',
    description:
      'Gets current live weather for any city. Use for weather, temperature, or climate questions.',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name like Lahore, Dubai, or Atlanta'
        }
      },
      required: ['city']
    }
  },
  {
    name: 'save_weather_report',
    description:
      'Saves a weather report to disk. Use when the user asks to save, remember, or store weather.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short title for the report' },
        content: { type: 'string', description: 'Full weather report content to save' }
      },
      required: ['title', 'content']
    }
  },
  {
    name: 'get_weather_reports',
    description:
      'Reads all saved weather reports. Use when the user asks to show, list, or get saved weather reports.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  }
];
