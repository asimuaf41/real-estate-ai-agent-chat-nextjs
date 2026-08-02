function evaluateMathExpression(expression) {
  const safeExpression = expression.trim();
  const allowedPattern = /^[0-9+\-*/().%\s]+$/;

  if (!allowedPattern.test(safeExpression)) {
    throw new Error('Expression contains unsupported characters');
  }

  // Limited evaluation for arithmetic expressions only.
  const result = Function(`"use strict"; return (${safeExpression});`)();

  if (!Number.isFinite(result)) {
    throw new Error('Invalid numeric result');
  }

  return result;
}

function getWeatherTool(city, country = 'N/A') {
  return {
    city,
    country,
    temperature: '32C',
    condition: 'Sunny',
    humidity: '45%',
    wind: '12 km/h'
  };
}

function saveNoteTool(title, content) {
  const savedNote = {
    success: true,
    id: Date.now(),
    title,
    content,
    savedAt: new Date().toISOString()
  };

  console.log('NOTE SAVED:', savedNote);
  return savedNote;
}

export function runTool(toolName, toolInput) {
  switch (toolName) {
    case 'calculator':
      return {
        result: evaluateMathExpression(toolInput.expression),
        expression: toolInput.expression
      };

    case 'get_weather':
      return getWeatherTool(toolInput.city, toolInput.country);

    case 'save_note':
      return saveNoteTool(toolInput.title, toolInput.content);

    default:
      throw new Error(`Unsupported tool: ${toolName}`);
  }
}
