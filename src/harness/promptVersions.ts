import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ACTIVE_PROMPTS = {
  coach: 'v2',
  reviewer: 'v3',
} as const;

export type PromptVersions = {
  coach: string;
  reviewer: string;
};

export type PromptName = 'healthCoach' | 'safetyReviewer';

export function loadPrompt(name: PromptName, version: string): string {
  const filePath = join(process.cwd(), 'prompts', `${name}.${version}.md`);
  return readFileSync(filePath, 'utf8').trim();
}
