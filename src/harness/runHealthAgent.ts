import { ask, getCoach } from '../agents/healthCoach';
import { reviewPlan } from '../agents/safetyReviewer';
import { savePlan, type CoachRunContext } from '../skills/plans';
import { resolveModel } from './model';
import { ACTIVE_PROMPTS, type PromptVersions } from './promptVersions';
import { addRound, type RoundState } from './rounds';
import { computeFinalScore, computeImproved } from './score';
import { saveRunTrace } from './traceRun';
import type { Review } from './validateReview';

export type HealthAgentResult = {
  plan: string;
  review: Review;
  rounds: RoundState[];
  finalScore: number;
  improved: boolean;
  promptVersions: PromptVersions;
  toolCalls: string[];
  durationMs: number;
  model: string;
};

export type RunHealthAgentOptions = {
  maxRounds?: number;
  model?: string;
};

function toResult(
  task: string,
  plan: string,
  review: Review,
  rounds: RoundState[],
  toolCalls: string[],
  startedAt: number,
  model: string,
): HealthAgentResult {
  const result: HealthAgentResult = {
    plan,
    review,
    rounds,
    finalScore: computeFinalScore(rounds),
    improved: computeImproved(rounds),
    promptVersions: { ...ACTIVE_PROMPTS },
    toolCalls,
    durationMs: Date.now() - startedAt,
    model,
  };
  saveRunTrace({
    task,
    promptVersions: result.promptVersions,
    rounds,
    toolCalls,
    finalScore: result.finalScore,
    durationMs: result.durationMs,
    model,
  });
  return result;
}

export async function runHealthAgent(
  task: string,
  maxRoundsOrOptions: number | RunHealthAgentOptions = 3,
): Promise<HealthAgentResult> {
  const options =
    typeof maxRoundsOrOptions === 'number'
      ? { maxRounds: maxRoundsOrOptions }
      : maxRoundsOrOptions;
  const maxRounds = options.maxRounds ?? 3;
  const model = resolveModel(options.model);
  const startedAt = Date.now();

  // Профиль/дневник больше не подставляются целиком — коуч сам вызывает getProfile/getRecentLog через tools.
  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  });
  const ctx = `Сегодня: ${today}\nЗадача: ${task}`;

  const coach = getCoach(model);
  // planApproved контролирует harness, не промпт: savePlanTool отказывает коучу в записи,
  // пока это поле не станет true (см. src/skills/plans.ts).
  const runContext: CoachRunContext = { planApproved: false };
  const toolCalls: string[] = [];

  const draft = await ask(coach, ctx, runContext);
  toolCalls.push(...draft.toolCalls);
  let plan = draft.text;
  const rounds: RoundState[] = [];

  for (let round = 1; round <= maxRounds; round++) {
    const review = await reviewPlan(task, plan, model);
    addRound(rounds, plan, review);
    console.log(`Раунд ${round}: verdict=${review.verdict}, score=${review.score}, issues=${JSON.stringify(review.issues)}`);

    if (review.verdict === 'needs_human_professional') {
      console.log('Запрос требует обращения к специалисту. Остановка.');
      return toResult(task, plan, review, rounds, toolCalls, startedAt, model);
    }
    if (review.verdict === 'approve') {
      // Персистенция — ответственность harness, а не коуча: сохраняем сами, детерминированно,
      // не полагаясь на то, что модель действительно вызовет savePlan в отдельном ходе.
      runContext.planApproved = true;
      savePlan(plan);
      console.log(`План сохранён в output.md. Score: ${review.score}`);
      return toResult(task, plan, review, rounds, toolCalls, startedAt, model);
    }
    if (round === maxRounds) {
      console.log('Лимит ревизий исчерпан, план не сохранён.');
      return toResult(task, plan, review, rounds, toolCalls, startedAt, model);
    }
    // Замечания обратно коучу
    const revision = await ask(
      coach,
      `${ctx}\n\n# Предыдущий план\n${plan}\n\n# Замечания ревьюера\n${review.issues.join('\n')}\n\nИсправь план.`,
      runContext,
    );
    toolCalls.push(...revision.toolCalls);
    plan = revision.text;
  }

  throw new Error('Unreachable: revision loop exited without return');
}

