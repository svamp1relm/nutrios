import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@openai/agents';
import { z } from 'zod';

export function getProfile(): string {
  return readFileSync(join(process.cwd(), 'data', 'profile.md'), 'utf8');
}

export const getProfileTool = tool({
  name: 'getProfile',
  description:
    'Читает профиль пользователя из data/profile.md: имя, возраст, рост/вес, цели, ограничения по здоровью и питанию (что вызывает прыщи, непереносимости), режим дня и пищевые предпочтения. Вызывай в начале работы почти над любым планом — без профиля легко нарушить ограничения пользователя.',
  parameters: z.object({}),
  execute: async () => getProfile(),
});
