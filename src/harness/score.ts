import type { RoundState } from './rounds';

export function computeFinalScore(rounds: readonly RoundState[]): number {
  const lastApprove = [...rounds]
    .reverse()
    .find((item) => item.review.verdict === 'approve');
  if (lastApprove) return lastApprove.review.score;
  return rounds.at(-1)?.review.score ?? 0;
}

export function computeImproved(rounds: readonly RoundState[]): boolean {
  if (rounds.length < 2) return false;
  return rounds[rounds.length - 1].review.score > rounds[0].review.score;
}
