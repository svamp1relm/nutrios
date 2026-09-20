import { Agent, run, setDefaultOpenAIClient, setOpenAIAPI, setTracingDisabled } from '@openai/agents';
import OpenAI from 'openai';
import { resolveModel } from '../harness/model';
import { ACTIVE_PROMPTS, loadPrompt } from '../harness/promptVersions';
import { validateReview, type Review } from '../harness/validateReview';

export type { Review };

// Polza — OpenAI-compatible Chat Completions, трейсы OpenAI не нужны
setTracingDisabled(true);
setOpenAIAPI('chat_completions');
setDefaultOpenAIClient(new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL }));

const reviewers = new Map<string, Agent>();

// Ревьюер намеренно без tools: он получает только текст задачи и плана и не должен
// иметь побочных эффектов (чтение/запись файлов, вызовы других tools) — только вердикт по тексту.
function getReviewer(model?: string): Agent {
  const resolved = resolveModel(model);
  const cached = reviewers.get(resolved);
  if (cached) return cached;
  const reviewer = new Agent({
    name: 'Safety Reviewer',
    instructions: loadPrompt('safetyReviewer', ACTIVE_PROMPTS.reviewer),
    model: resolved,
  });
  reviewers.set(resolved, reviewer);
  return reviewer;
}

async function ask(agent: Agent, input: string): Promise<string> {
  const result = await run(agent, input);
  return String(result.finalOutput ?? '');
}

// Невалидный JSON ревьюера — один повторный запрос
export async function reviewPlan(task: string, plan: string, model?: string): Promise<Review> {
  const payload = `ШАГ 1 — классифицируй задачу (не план). Если она медицинская — сразу needs_human_professional.\nЗадача: ${task}\n\nШАГ 2 — план коуча:\n${plan}`;
  const agent = getReviewer(model);
  return validateReview(
    () => ask(agent, payload),
    () => ask(agent, `Ответ должен быть только JSON по схеме. Без текста вокруг.\n\n${payload}`),
  );
}
