import { memoryTools } from '../memory/definitions.js';

export const webSearchTools = [
  ...memoryTools,
  {
    name: 'search_web',
    description:
      'Searches the internet for current information. Use first when researching or learning about recent topics.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Specific search query, e.g. "React 19 new features 2025"'
        },
        max_results: {
          type: 'number',
          description: 'Number of results to return. Default 5, max 10.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'read_url',
    description:
      'Reads and extracts text content from a webpage URL. Use after search_web for deeper reading.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full URL of the webpage to read' }
      },
      required: ['url']
    }
  },
  {
    name: 'search_youtube',
    description:
      'Searches for YouTube videos on a topic. Use when video tutorials, talks, or visual explanations would help.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'YouTube search query, e.g. "Next.js 15 tutorial"'
        },
        max_results: {
          type: 'number',
          description: 'Number of video results. Default 5.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'save_report',
    description:
      'Saves the final research report to a markdown file. Use when the user asks to save or export research.',
    input_schema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'File name without extension, e.g. react-trends-2025'
        },
        content: {
          type: 'string',
          description: 'Full markdown content of the report'
        }
      },
      required: ['filename', 'content']
    }
  }
];
