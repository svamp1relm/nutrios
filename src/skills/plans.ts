import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@openai/agents';
import { z } from 'zod';

// Гейт для savePlanTool. Значение выставляет только harness (runHealthAgent),
// и только после того, как safety reviewer вернул verdict "approve" — прежде чем
// доверять коучу через prompt-инструкцию "сохраняй только одобренное", мы уже
// один раз наступили на грабли с verdict/score (модель не всегда соблюдает
// словесные правила). Здесь то же самое: правило enforced в коде, а не в тексте.
export type CoachRunContext = { planApproved: boolean };

export function savePlan(markdown: string): { ok: true } {
  writeFileSync(join(process.cwd(), 'data', 'output.md'), markdown);
  return { ok: true };
}

export const savePlanTool = tool({
  name: 'savePlan',
  description:
    'Сохраняет финальный текст плана в data/output.md. Вызывай только если тебя явно просят сохранить уже одобренный ревьюером план — попытка сохранить неодобренный план будет отклонена.',
  parameters: z.object({
    markdown: z.string().describe('Полный текст одобренного плана в markdown, без изменений'),
  }),
  execute: async (input, runContext) => {
    const approved = (runContext?.context as CoachRunContext | undefined)?.planApproved;
    if (!approved) {
      return { ok: false, reason: 'План ещё не прошёл проверку ревьюера — сохранение недоступно.' };
    }
    return savePlan(input.markdown);
  },
});
