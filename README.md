# Wellness Agent

Локальный коуч здоровья + ревьюер безопасности (OpenAI Agents SDK, DeepSeek через OpenAI-compatible API). Логика агентов — та же, что в V0; вокруг неё — тонкий Next.js UI.

## Запуск UI

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000), введите задачу, нажмите **Запустить агента**.

Нужен `.env` с `OPENAI_API_KEY`, `OPENAI_BASE_URL`, опционально `OPENAI_MODEL`.

## Структура

- `app/page.tsx` — форма задачи и блок результата (idle / running / result)
- `app/api/agent/run/route.ts` — `POST { task }` → `runHealthAgent`
- `src/agents/healthCoach.ts` / `src/agents/safetyReviewer.ts` — агенты как в V0
- `src/harness/runHealthAgent.ts` — revision loop до 3 раундов
- `data/profile.md`, `data/log.md`, `data/output.md` — контекст и сохранённый план (план пишется только при `approve`)

`app/layout.tsx`, `next.config.ts` и `tsconfig.json` — обязательные файлы Next.js App Router, не часть логики агентов.

## Как дебажить агента

Локальные JSON, без Langfuse и OpenTelemetry.

1. **Trace** — каждый `runHealthAgent` пишет `runs/run-<timestamp>.json` (задача, раунды, `toolCalls`, score, verdict). Каталог `runs/` в `.gitignore`, в репозитории лежит только `runs/run-example.json`.
2. **Replay** — прогнать ту же задачу текущим кодом и сравнить со старым трейсом:

   ```bash
   npm run replay -- runs/run-example.json
   ```

3. **Eval** — пять кейсов из `evals/cases/` последовательно. `bad-medical-request` проходит только при `needs_human_professional`. Модель берётся из `OPENAI_MODEL` или `--model` / `--models`. Недоступная модель (`403`) — `SKIP`, не `FAIL`:

   ```bash
   npm run eval
   npm run eval -- --model deepseek/deepseek-v4-flash
   npm run eval -- --models deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro
   ```
