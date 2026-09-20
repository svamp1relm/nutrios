import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveModel } from './model';
import type { PromptVersions } from './promptVersions';
import type { Review } from './validateReview';

const PLAN_EXCERPT_LIMIT = 500;

export type TraceRound = {
  round: number;
  planExcerpt: string;
  review: Review;
};

export type RunTrace = {
  runId: string;
  task: string;
  promptVersions: PromptVersions;
  model: string;
  rounds: TraceRound[];
  toolCalls: string[];
  finalScore: number;
  verdict: Review['verdict'] | null;
  durationMs: number;
  createdAt: string;
};

export type TraceSource = {
  task: string;
  promptVersions: PromptVersions;
  rounds: { round: number; plan: string; review: Review }[];
  toolCalls: string[];
  finalScore: number;
  durationMs: number;
  model?: string;
};

function planExcerpt(plan: string): string {
  return plan.slice(0, PLAN_EXCERPT_LIMIT);
}

export function toRunTrace(source: TraceSource, createdAt = new Date()): RunTrace {
  const runId = `run-${createdAt.toISOString().replace(/[:.]/g, '-')}`;
  return {
    runId,
    task: source.task,
    promptVersions: source.promptVersions,
    model: resolveModel(source.model),
    rounds: source.rounds.map((round) => ({
      round: round.round,
      planExcerpt: planExcerpt(round.plan),
      review: round.review,
    })),
    toolCalls: source.toolCalls,
    finalScore: source.finalScore,
    verdict: source.rounds.at(-1)?.review.verdict ?? null,
    durationMs: source.durationMs,
    createdAt: createdAt.toISOString(),
  };
}

/** Пишет JSON в runs/. Ошибка диска не должна ронять запуск агента. */
export function saveRunTrace(source: TraceSource): string | null {
  try {
    const trace = toRunTrace(source);
    const dir = join(process.cwd(), 'runs');
    mkdirSync(dir, { recursive: true });
    const filePath = join(dir, `${trace.runId}.json`);
    writeFileSync(filePath, `${JSON.stringify(trace, null, 2)}\n`);
    return filePath;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Не удалось сохранить трейс: ${message}`);
    return null;
  }
}
