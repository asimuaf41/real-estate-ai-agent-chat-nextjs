import { WEATHER_SYSTEM_PROMPT } from '../prompts/weatherPrompt.js';
import { weatherTools } from '../tools/weather/definitions.js';
import { runWeatherTool } from '../tools/weather/handlers.js';
import { streamAgentWithTools } from '../utils/agentLoop.js';

export async function streamWeatherChat(singleMessage, onEvent) {
  await streamAgentWithTools({
    system: WEATHER_SYSTEM_PROMPT,
    tools: weatherTools,
    messages: [{ role: 'user', content: singleMessage }],
    runTool: runWeatherTool,
    onEvent
  });
}
