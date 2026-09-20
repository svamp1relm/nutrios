import { Agent, run, setDefaultOpenAIClient, setOpenAIAPI, setTracingDisabled } from '@openai/agents';
import OpenAI from 'openai';
import { resolveModel } from '../harness/model';
import { ACTIVE_PROMPTS, loadPrompt } from '../harness/promptVersions';
import { getProfileTool } from '../skills/profile';
import { getRecentLogTool } from '../skills/logs';
import { savePlanTool, type CoachRunContext } from '../skills/plans';
import { generateShoppingListTool } from '../skills/shopping';
import { suggestWorkoutTemplateTool } from '../skills/workouts';
import { listFavoriteRecipesTool } from '../skills/recipes';

export type { CoachRunContext };

// Polza — OpenAI-compatible Chat Completions, трейсы OpenAI не нужны
setTracingDisabled(true);
setOpenAIAPI('chat_completions');
setDefaultOpenAIClient(new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL }));

// Простой фиксированный массив tools — без реестра и плагинной системы.
// Только Health Coach получает tools; Safety Reviewer намеренно остаётся без них (см. safetyReviewer.ts).
const coachTools = [
  getProfileTool,
  getRecentLogTool,
  savePlanTool,
  generateShoppingListTool,
  suggestWorkoutTemplateTool,
  listFavoriteRecipesTool,
];

const coaches = new Map<string, Agent>();

export function getCoach(model?: string): Agent {
  const resolved = resolveModel(model);
  const cached = coaches.get(resolved);
  if (cached) return cached;
  const coach = new Agent({
    name: 'Health Coach',
    instructions: loadPrompt('healthCoach', ACTIVE_PROMPTS.coach),
    model: resolved,
    tools: coachTools,
  });
  coaches.set(resolved, coach);
  return coach;
}

export type AskResult = { text: string; toolCalls: string[] };

export async function ask(agent: Agent, input: string, context?: CoachRunContext): Promise<AskResult> {
  const result = await run(agent, input, context ? { context } : undefined);
  const toolCalls = result.newItems
    .filter((item) => item.type === 'tool_call_item' && item.rawItem.type === 'function_call')
    .map((item) => (item.rawItem as { name: string }).name);
  return { text: String(result.finalOutput ?? ''), toolCalls };
}
