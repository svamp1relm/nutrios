import type { Review } from './validateReview';

export type RoundState = {
  round: number;
  plan: string;
  review: Review;
};

export function addRound(rounds: RoundState[], plan: string, review: Review): RoundState {
  const state: RoundState = {
    round: rounds.length + 1,
    plan,
    review,
  };
  rounds.push(state);
  return state;
}
