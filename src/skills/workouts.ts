import { tool } from '@openai/agents';
import { z } from 'zod';

const TEMPLATES: Record<string, string> = {
  выносливость:
    '## Шаблон: выносливость\n- Бег или кардио 30–40 минут в среднем темпе\n- 2–3 круга: 15 берпи, 20 приседаний, 1 минута планки\n- Заминка: 5 минут растяжки',
  сила:
    '## Шаблон: сила\n- Разминка 5–10 минут\n- 4 подхода по 6–8 повторений: присед, жим, тяга\n- Отдых 90–120 секунд между подходами',
  бокс:
    '## Шаблон: бокс\n- Разминка со скакалкой 5 минут\n- 5 раундов по 3 минуты: удары по груше/лапам\n- Работа ног и связки, 1 минута отдыха между раундами',
  восстановление:
    '## Шаблон: лёгкое восстановление\n- Быстрая ходьба или лёгкий велосипед 20–25 минут\n- Растяжка всего тела 10 минут\n- Дыхательные упражнения 5 минут',
};

const DEFAULT_KEY = 'выносливость';

export function suggestWorkoutTemplate(goal: string): string {
  const normalized = goal.toLowerCase();
  const key = Object.keys(TEMPLATES).find((candidate) => normalized.includes(candidate)) ?? DEFAULT_KEY;
  return TEMPLATES[key];
}

export const suggestWorkoutTemplateTool = tool({
  name: 'suggestWorkoutTemplate',
  description:
    'Возвращает готовый шаблон тренировки (выносливость, сила, бокс или лёгкое восстановление) под цель пользователя. Передай короткое описание цели, например "выносливость", "бокс", "сила" или "восстановление". Используй шаблон как основу и адаптируй под профиль, не копируй дословно, если не подходит.',
  parameters: z.object({
    goal: z.string().describe('Цель или тип тренировки, например "выносливость", "бокс", "сила", "восстановление"'),
  }),
  execute: async (input) => suggestWorkoutTemplate(input.goal),
});
