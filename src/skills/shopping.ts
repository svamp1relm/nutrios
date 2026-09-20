import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@openai/agents';
import { z } from 'zod';

const MEAL_HEADING =
  /питани|еда|рацион|завтрак|обед|ужин|полдник|перекус|snack/i;
const NON_MEAL_HEADING =
  /тренир|движен|сон|восстанов|привычк|резюме|workout|sleep|habit/i;

// Берём пункты списков из пищевых разделов. Заголовки в планах часто
// «Завтрак / Обед / Ужин», а не общее «Питание» — учитываем оба варианта.
function extractIngredients(planMarkdown: string): string[] {
  const items = new Set<string>();
  let inNutritionSection = false;

  for (const rawLine of planMarkdown.split('\n')) {
    const line = rawLine.trim();
    const heading = line.match(/^#{1,3}\s*\d*\.?\s*(.+)/);
    if (heading) {
      const title = heading[1];
      if (MEAL_HEADING.test(title)) {
        inNutritionSection = true;
      } else if (NON_MEAL_HEADING.test(title)) {
        inNutritionSection = false;
      }
      continue;
    }
    if (!inNutritionSection) continue;

    const bullet = line.match(/^[-*]\s+(.+)/) ?? line.match(/^\d+\.\s+(.+)/);
    if (bullet) items.add(bullet[1]);
  }

  return [...items];
}

function loadSavedPlan(): string {
  try {
    return readFileSync(join(process.cwd(), 'data', 'output.md'), 'utf8');
  } catch {
    return '';
  }
}

export function generateShoppingList(planMarkdown: string): string {
  let items = extractIngredients(planMarkdown);
  // Если модель передала урезанный текст без пищевых заголовков — берём последний одобренный план.
  if (items.length === 0) items = extractIngredients(loadSavedPlan());
  const body =
    items.length > 0
      ? items.map((item) => `- ${item}`).join('\n')
      : '- Не удалось выделить продукты из плана автоматически, добавьте вручную';
  const markdown = `# Список покупок\n\n${body}\n`;
  writeFileSync(join(process.cwd(), 'data', 'shopping.md'), markdown);
  return markdown;
}

export const generateShoppingListTool = tool({
  name: 'generateShoppingList',
  description:
    'Извлекает продукты из раздела питания готового плана и сохраняет список покупок в data/shopping.md. Передай в planMarkdown полный текст плана (включая раздел "Питание"). Вызывай, когда пользователь просит список покупок к плану.',
  parameters: z.object({
    planMarkdown: z.string().describe('Полный текст плана в markdown, включая раздел питания'),
  }),
  execute: async (input) => generateShoppingList(input.planMarkdown),
});
