import { anthropicClient } from '../config/anthropic.js';
import { ORCHESTRATOR_PLANNER_PROMPT } from '../prompts/multiAgentPrompts.js';
import {
  analysisAgent,
  databaseAgent,
  researchAgent,
  userPreferenceAgent,
  writerAgent
} from './agents/specialistAgents.js';
import { sendEmail } from './email.service.js';
import { saveReport } from './report.service.js';
import { addAnthropicUsage } from '../utils/anthropicUsage.js';

const TEXT_CHUNK_SIZE = 60;

function chunkText(text, size = TEXT_CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

function getLatestUserRequest(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user' && typeof messages[i].content === 'string') {
      return messages[i].content;
    }
  }
  return '';
}

function parsePlan(rawText, fallbackRequest) {
  const fallback = {
    research_query: fallbackRequest,
    database_query: fallbackRequest,
    analysis_criteria: 'value for money, location, condition, suitability',
    report_topic: fallbackRequest,
    recipient: null
  };

  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return { ...fallback, ...JSON.parse(cleaned) };
  } catch {
    return fallback;
  }
}

async function planTask(userRequest, model) {
  const response = await anthropicClient.messages.create({
    model,
    max_tokens: 500,
    system: ORCHESTRATOR_PLANNER_PROMPT,
    messages: [{ role: 'user', content: userRequest }]
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return {
    plan: parsePlan(text, userRequest),
    usage: response.usage
  };
}

function wantsEmail(userRequest, plan) {
  if (plan.recipient) return true;
  return /\b(email|send|deliver|mail)\b/i.test(userRequest);
}

/**
 * Orchestrates the 5 specialist agents and streams progress over `onEvent`.
 * Reuses the tool_use / tool_result SSE shape so the frontend stream hook
 * renders each agent's activity, then streams the final report as text.
 */
export async function runMultiAgentWorkflow(messages, userId, onEvent, usage, model) {
  const userRequest = getLatestUserRequest(messages);
  const resolvedUserId = userId || 'anonymous';
  if (usage) {
    usage.model = model;
  }

  if (!userRequest.trim()) {
    onEvent({ text: 'Please describe the research and report task you need.' });
    return usage;
  }

  // STEP 1 — Plan
  onEvent({ type: 'tool_use', tool: 'orchestrator', input: { request: userRequest } });
  const { plan, usage: planUsage } = await planTask(userRequest, model);
  addAnthropicUsage(usage, planUsage);
  onEvent({ type: 'tool_result', tool: 'orchestrator', result: { plan } });

  // STEP 2 — Preference + Research + Database in parallel
  onEvent({ type: 'tool_use', tool: 'preference_agent', input: { userId: resolvedUserId } });
  onEvent({ type: 'tool_use', tool: 'research_agent', input: { query: plan.research_query } });
  onEvent({ type: 'tool_use', tool: 'database_agent', input: { query: plan.database_query } });

  const [preference, research, database] = await Promise.all([
    userPreferenceAgent(resolvedUserId, model),
    researchAgent(plan.research_query, model),
    databaseAgent(plan.database_query, 5, model)
  ]);
  addAnthropicUsage(usage, preference.usage);
  addAnthropicUsage(usage, research.usage);
  addAnthropicUsage(usage, database.usage);

  onEvent({
    type: 'tool_result',
    tool: 'preference_agent',
    result: { summary: preference.summary, memoryCount: preference.memoryCount }
  });
  onEvent({
    type: 'tool_result',
    tool: 'research_agent',
    result: { summary: research.summary, sources: research.sources }
  });
  onEvent({
    type: 'tool_result',
    tool: 'database_agent',
    result: {
      summary: database.summary,
      matchCount: database.matchCount,
      matches: database.matches ?? []
    }
  });

  // STEP 3 — Analysis
  onEvent({ type: 'tool_use', tool: 'analysis_agent', input: { criteria: plan.analysis_criteria } });
  const analysis = await analysisAgent(
    `${research.summary}\n\n${database.summary}`,
    plan.analysis_criteria,
    preference.summary,
    model
  );
  addAnthropicUsage(usage, analysis.usage);
  onEvent({ type: 'tool_result', tool: 'analysis_agent', result: { summary: analysis.summary } });

  // STEP 4 — Writer
  onEvent({ type: 'tool_use', tool: 'writer_agent', input: { topic: plan.report_topic } });
  const written = await writerAgent({
    topic: plan.report_topic,
    preferences: preference.summary,
    researchData: research.summary,
    databaseData: database.summary,
    analysisData: analysis.summary,
    model
  });
  const report = written.report;
  addAnthropicUsage(usage, written.usage);
  const saved = await saveReport(plan.report_topic, report);
  onEvent({
    type: 'tool_result',
    tool: 'writer_agent',
    result: { savedTo: saved.savedTo, length: report.length }
  });

  // STEP 5 — Communication (email) when requested
  if (wantsEmail(userRequest, plan)) {
    onEvent({
      type: 'tool_use',
      tool: 'communication_agent',
      input: { recipient: plan.recipient ?? 'client' }
    });
    const email = await sendEmail({
      to: plan.recipient ?? '',
      subject: plan.report_topic,
      body: report
    });
    onEvent({ type: 'tool_result', tool: 'communication_agent', result: email });
  }

  // Stream the final report as assistant text
  for (const piece of chunkText(report)) {
    onEvent({ text: piece });
  }

  return usage;
}
