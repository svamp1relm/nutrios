import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@openai/agents';
import { z } from 'zod';

type LogEntry = { date: string; body: string };

// Дневник — плоский markdown с разделами "## YYYY-MM-DD" по дням.
function parseLogEntries(content: string): LogEntry[] {
  const entries: LogEntry[] = [];
  let current: LogEntry | null = null;
  for (const line of content.split('\n')) {
    const heading = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
    if (heading) {
      if (current) entries.push(current);
      current = { date: heading[1], body: `${line}\n` };
    } else if (current) {
      current.body += `${line}\n`;
    }
  }
  if (current) entries.push(current);
  return entries;
}

export function getRecentLog(days: number): string {
  const content = readFileSync(join(process.cwd(), 'data', 'log.md'), 'utf8');
  const entries = parseLogEntries(content);
  if (entries.length === 0) return 'Дневник пуст, записей нет.';

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = entries.filter((entry) => new Date(entry.date).getTime() >= cutoff);
  if (recent.length === 0) return `За последние ${days} дн. записей в дневнике нет.`;

  return recent.map((entry) => entry.body.trim()).join('\n\n');
}

export const getRecentLogTool = tool({
  name: 'getRecentLog',
  description:
    'Читает последние N дней дневника пользователя (data/log.md): самочувствие, сон, тренировки и питание за прошедшие дни. Вызывай, когда план должен учитывать недавнюю историю — например, если в задаче явно просят учесть лог/дневник. Пустой дневник — нормальный результат, не ошибка.',
  parameters: z.object({
    days: z.number().int().min(1).max(30).describe('Сколько последних дней дневника нужно, обычно 3–7'),
  }),
  execute: async (input) => getRecentLog(input.days),
});
