import { WEATHER_SYSTEM_PROMPT } from '../prompts/weatherPrompt.js';
import { weatherTools } from '../tools/weather/definitions.js';
import { runWeatherTool } from '../tools/weather/handlers.js';
import { streamAgentWithTools } from '../utils/agentLoop.js';

export async function streamWeatherChat(singleMessage, onEvent, usage, model, userId) {
  return streamAgentWithTools({
    system: WEATHER_SYSTEM_PROMPT,
    tools: weatherTools,
    messages: [{ role: 'user', content: singleMessage }],
    runTool: runWeatherTool,
    onEvent,
    usage,
    model,
    userId,
    agentType: 'weather',
  });
}
