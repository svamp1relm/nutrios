import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@openai/agents';
import { z } from 'zod';

export function listFavoriteRecipes(): string {
  return readFileSync(join(process.cwd(), 'data', 'recipes.md'), 'utf8');
}

export const listFavoriteRecipesTool = tool({
  name: 'listFavoriteRecipes',
  description:
    'Возвращает список любимых рецептов пользователя из data/recipes.md (русская, грузинская и японская кухня, простые рецепты на 20–30 минут). Используй для конкретных блюд в плане питания вместо абстрактных формулировок вроде "лёгкий белковый ужин".',
  parameters: z.object({}),
  execute: async () => listFavoriteRecipes(),
});
