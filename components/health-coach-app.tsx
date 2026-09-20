'use client';

import { type FormEvent, useState } from 'react';
import { LeafIcon } from 'lucide-react';
import type { HealthAgentResult } from '@/src/harness/runHealthAgent';
import { AgentOutcome } from '@/components/agent-outcome';
import { SafetyReview } from '@/components/safety-review';
import { TaskForm } from '@/components/task-form';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'running' | 'result';

export function HealthCoachApp() {
  const [task, setTask] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<HealthAgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = task.trim();
    if (!trimmed || status === 'running') return;

    setStatus('running');
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: trimmed }),
      });
      const data = (await response.json()) as HealthAgentResult & { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Ошибка запроса');
        setStatus('idle');
        return;
      }
      setResult(data);
      setStatus('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('idle');
    }
  }

  const busy = status === 'running';

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-5 py-10 pb-20">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <LeafIcon />
          </div>
          <div className="flex max-w-xl flex-col gap-1">
            <h1 className="font-heading text-3xl leading-none font-semibold tracking-tight text-balance">
              Health Coach Agent
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Опишите цель — коуч составит wellness-план, а ревьюер проверит его на безопасность перед выдачей.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="h-7 shrink-0 px-2.5">
          <span
            className={cn(
              'size-1.5 rounded-full',
              status === 'result' && !error && 'bg-primary',
              status === 'running' && 'bg-warning-foreground',
              status === 'idle' && !error && 'bg-muted-foreground',
              error && 'bg-destructive',
            )}
            aria-hidden="true"
          />
          {error ? 'Ошибка' : status === 'running' ? 'В работе' : status === 'result' ? 'Готово' : 'Готов'}
        </Badge>
      </header>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <TaskForm
          task={task}
          busy={busy}
          error={error}
          onTaskChange={setTask}
          onSubmit={onSubmit}
        />
        <SafetyReview status={status} result={result} />
      </div>

      <AgentOutcome status={status} result={result} error={error} />
    </main>
  );
}
