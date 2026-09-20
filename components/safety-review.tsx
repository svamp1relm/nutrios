'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, ChevronDownIcon, CircleAlertIcon, ClockIcon } from 'lucide-react';
import type { HealthAgentResult } from '@/src/harness/runHealthAgent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const STEPS = ['Черновик', 'Ревью', 'Правки', 'Финал'] as const;
const MAX_ROUNDS = 3;
const MAX_SCORE = 10;

type Verdict = HealthAgentResult['review']['verdict'];

const VERDICT_COPY: Record<
  Verdict,
  { label: string; variant: 'success' | 'warning' | 'destructive'; icon: typeof CheckIcon }
> = {
  approve: { label: 'Одобрено', variant: 'success', icon: CheckIcon },
  revise: { label: 'На доработке', variant: 'warning', icon: CircleAlertIcon },
  needs_human_professional: { label: 'Нужен специалист', variant: 'destructive', icon: ClockIcon },
};

type SafetyReviewProps = {
  status: 'idle' | 'running' | 'result';
  result: HealthAgentResult | null;
  className?: string;
};

export function SafetyReview({ status, result, className }: SafetyReviewProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (status !== 'running') return;
    setActiveStep(0);
    const id = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, STEPS.length - 2));
    }, 2800);
    return () => window.clearInterval(id);
  }, [status]);

  const done = status === 'result' && result;
  const verdict = done ? VERDICT_COPY[result.review.verdict] : null;
  const VerdictIcon = verdict?.icon;

  return (
    <Card className={cn('h-full', className)} aria-busy={status === 'running'} aria-live="polite">
      <CardHeader>
        <CardTitle>Проверка безопасности</CardTitle>
        <CardDescription>Ревью коуч → ревьюер</CardDescription>
        <CardAction>
          {verdict && VerdictIcon ? (
            <Badge variant={verdict.variant}>
              <VerdictIcon data-icon="inline-start" />
              {verdict.label}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              {status === 'running' ? 'В работе' : 'В очереди'}
            </span>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {done ? <ReviewMetrics result={result} /> : <ReviewSteps activeStep={activeStep} running={status === 'running'} />}
      </CardContent>
    </Card>
  );
}

function ReviewSteps({ activeStep, running }: { activeStep: number; running: boolean }) {
  return (
    <ol className="flex flex-col gap-3">
      {STEPS.map((label, index) => {
        const current = running && index === activeStep;
        const passed = running && index < activeStep;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full text-sm font-medium tabular-nums',
                current || passed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {index + 1}
            </span>
            <span className={cn(current || passed ? 'text-foreground' : 'text-muted-foreground')}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} мс`;
  return `${(ms / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} с`;
}

function ReviewMetrics({ result }: { result: HealthAgentResult }) {
  const score = result.finalScore;
  const percent = Math.min(100, Math.max(0, (score / MAX_SCORE) * 100));
  const roundCount = result.rounds.length;

  return (
    <div className="flex flex-col">
      <section className="flex flex-col gap-2 py-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Оценка безопасности
          </h3>
          <p className="font-heading text-sm font-medium tabular-nums">
            {score}/{MAX_SCORE}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Оценка безопасности"
          aria-valuemin={0}
          aria-valuemax={MAX_SCORE}
          aria-valuenow={score}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <Separator className="my-4" />

      <section className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Раундов ревью
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: MAX_ROUNDS }, (_, index) => (
              <span
                key={index}
                className={cn(
                  'size-2 rounded-full',
                  index < roundCount ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
          <p className="font-heading text-sm font-medium tabular-nums">
            {roundCount}/{MAX_ROUNDS}
          </p>
        </div>
      </section>

      <Separator className="my-4" />

      <section className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Длительность
        </h3>
        <p className="font-heading text-sm font-medium tabular-nums">
          {formatDuration(result.durationMs)}
        </p>
      </section>

      <Separator className="my-4" />

      <section className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Промпты
        </h3>
        <p className="text-sm tabular-nums">
          коуч {result.promptVersions.coach} · ревьюер {result.promptVersions.reviewer}
        </p>
      </section>

      <Separator className="my-4" />

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="group h-11 w-full justify-between px-2">
            История раундов
            <ChevronDownIcon
              data-icon="inline-end"
              className="motion-safe:transition-transform motion-reduce:transition-none group-data-[state=open]:rotate-180"
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex flex-col gap-2 pt-2">
            {result.rounds.map((item) => (
              <li key={item.round} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  Раунд {item.round} — {VERDICT_COPY[item.review.verdict].label} — {item.review.score}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="my-4" />

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Замечания
        </h3>
        {result.review.issues.length === 0 ? (
          <p className="flex items-center gap-2 text-sm">
            <Badge variant="success">
              <CheckIcon data-icon="inline-start" />
              Замечаний нет
            </Badge>
          </p>
        ) : (
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {result.review.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
