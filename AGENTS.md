# Health Coach Agent — правила для агента

Локальный коуч здоровья + ревьюер безопасности: Next.js 16 (App Router), TypeScript, OpenAI Agents SDK, DeepSeek через OpenAI-compatible API, Zod, shadcn/ui (Nova + Radix) и Tailwind CSS v4. Логика агентов как в V0, вокруг неё тонкий UI. Это wellness-инструмент, не медицинский сервис.

Название продукта в UI и в `metadata.title` — **Health Coach Agent**. Остальной интерфейс и пользовательские тексты — на русском (`lang="ru"`). Не добавляй другие английские подписи без явной просьбы.

Перед правками Next.js читай актуальные гайды в `node_modules/next/dist/docs/` (версия пакета, не память модели). Перед правками UI читай `.agents/skills/shadcn/SKILL.md` и ставь компоненты через `npx shadcn@latest add`.

## Структура

```
app/
  page.tsx                   # серверная страница, рендерит HealthCoachApp
  layout.tsx                 # шрифты, мета, skip-link
  globals.css                # Tailwind + токены shadcn (sage / wellness)
  api/agent/run/route.ts     # POST { task } → runHealthAgent
components/
  health-coach-app.tsx       # клиентское состояние и оркестрация
  task-form.tsx              # форма задачи и примеры
  agent-outcome.tsx          # idle / running / error / result
  safety-review.tsx          # очередь шагов и вердикт ревьюера
  ui/                        # исходники shadcn, не править без нужды
src/
  agents/healthCoach.ts      # агент-коуч (промпт из prompts/)
  agents/safetyReviewer.ts   # агент-ревьюер (промпт из prompts/)
  harness/runHealthAgent.ts  # оркестратор: цикл ревизий, публичный API
  harness/validateReview.ts  # Zod-схема ревью + safe-parse с одним ретраем
  harness/rounds.ts          # RoundState и история раундов
  harness/score.ts           # finalScore (последний approve) и improved
  harness/promptVersions.ts  # ACTIVE_PROMPTS + загрузка prompts/*.md
prompts/
  healthCoach.v1.md
  safetyReviewer.v1.md
data/
  profile.md                 # профиль пользователя
  log.md                     # дневник
  output.md                  # сохранённый план (только при approve)
lib/utils.ts                 # cn()
components.json              # конфиг shadcn
```

`next.config.ts`, `tsconfig.json` и `postcss.config.mjs` — инфраструктура App Router / Tailwind, не часть логики агентов.

Поток: форма шлёт `POST /api/agent/run` с `{ task }` → `runHealthAgent(task, maxRounds = 3)` → `{ plan, review, rounds, finalScore, promptVersions, durationMs, model }`. При `needs_human_professional` план скрыт, показывается предупреждение. План пишется в `data/output.md` только при `approve`.

Промпты агентов — в `prompts/*.md`. Активные версии задаёт `ACTIVE_PROMPTS` в `promptVersions.ts`. Не меняй тексты промптов и revision loop без явной просьбы.

## Команды

```bash
npm install          # зависимости
npm run dev          # Next.js на http://localhost:3000
npm run build        # production-сборка
npm run start        # запуск собранного приложения
npm run eval         # кейсы из evals/cases/, модель из OPENAI_MODEL
npm run eval -- --model deepseek/deepseek-v4-flash
```

Нужен `.env`: `OPENAI_API_KEY`, `OPENAI_BASE_URL`, опционально `OPENAI_MODEL`.

Тестового раннера нет. Не добавляй Vitest/Jest без явной просьбы. Проверка: `npm run build` и ручной прогон UI.

После UI-изменений проверяй в браузере: desktop и ~390px, форму, примеры, состояния idle / загрузка / ошибка / результат, светлую и тёмную тему.

## Код

- UI: `'use client'` только там, где есть состояние и обработчики. Стили — компоненты shadcn и утилиты Tailwind. Для форм: `FieldGroup` + `Field` + `FieldLabel` (`htmlFor`). Для набора из 2–7 вариантов — `ToggleGroup`. Цвета — семантические токены (`bg-primary`, `text-muted-foreground`), не сырые `bg-green-500`. Не писать параллельные кастомные кнопки, алерты и скелетоны.
- Тема и токены — в `app/globals.css`. Тёмная тема через `prefers-color-scheme`. Не подключать `next-themes` и не добавлять новые UI-библиотеки или анимационные SDK без необходимости.
- API: `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`. Не переносить вызов агентов в Server Actions без просьбы.
- Контекст агентов читается из `data/*.md`, без tools.
- Шрифты: `next/font` (Manrope, IBM Plex Mono). Не подключать Google Fonts через `<link>`.

### Доступность

Семантика: `main` / `header` / `form` / `label` + `htmlFor`. Видимый `:focus-visible` (кольцо shadcn). Ошибки и предупреждения — `Alert` с `role="alert"`. Загрузка — `aria-busy` и `aria-live`. Учитывать `prefers-reduced-motion`. Кнопка запуска не меньше 44px.

### Тестирование
При написании кода не пиши тесты и не используй TDD.

### Безопасность copy

Нельзя в UI и в ответах коуча: диагнозы, лечение, лекарства, дозировки, интерпретация симптомов как болезни. Можно: питание, тренировки, сон, привычки. Медицинский запрос → вердикт `needs_human_professional`, без плана на экране.

### Принципы кодовой базы

- Поддерживать кодовую базу в высокомодульном состоянии и с хорошей документацией.
- Следовать принципу "разделения ответственности" (separation of concerns).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
