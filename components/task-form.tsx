'use client';

import { type FormEvent, useId } from 'react';
import { SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export const EXAMPLES = [
  { label: 'Питание и тренировки', task: 'Составь план питания и тренировок на завтра' },
  { label: 'Улучшить сон', task: 'Как улучшить сон на этой неделе' },
  { label: 'Зарядка 20 минут', task: 'Легкая зарядка на 20 минут' },
];

type TaskFormProps = {
  task: string;
  busy: boolean;
  error: string | null;
  onTaskChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  className?: string;
};

export function TaskForm({ task, busy, error, onTaskChange, onSubmit, className }: TaskFormProps) {
  const hintId = useId();
  const examplesId = useId();
  const selectedExample = EXAMPLES.some((example) => example.task === task) ? task : '';

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle>Задача для агента</CardTitle>
        <CardDescription>Например: план питания и активности на завтра.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form id="task-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field data-disabled={busy || undefined}>
              <FieldLabel htmlFor="task">Опишите цель</FieldLabel>
              <Textarea
                id="task"
                value={task}
                onChange={(event) => onTaskChange(event.target.value)}
                rows={6}
                placeholder="Например: план питания и активности на завтра"
                disabled={busy}
                aria-describedby={hintId}
                className="min-h-40"
              />
              <FieldDescription id={hintId}>
                Еда, тренировки, сон, привычки. Медицинские запросы агент не закрывает планом.
              </FieldDescription>
            </Field>
            <Field>
              <FieldTitle id={examplesId}>Примеры</FieldTitle>
              <ToggleGroup
                type="single"
                variant="outline"
                size="lg"
                spacing={2}
                value={selectedExample}
                onValueChange={(value) => {
                  if (value) onTaskChange(value);
                }}
                disabled={busy}
                aria-labelledby={examplesId}
                className="flex w-full max-w-full flex-wrap"
              >
                {EXAMPLES.map((example) => (
                  <ToggleGroupItem
                    key={example.task}
                    value={example.task}
                    className="min-h-11"
                  >
                    {example.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-start">
        <Button
          type="submit"
          form="task-form"
          size="lg"
          disabled={busy || !task.trim()}
          className="min-h-11 w-full sm:w-auto"
        >
          {busy ? (
            <Spinner data-icon="inline-start" aria-label="Загрузка" />
          ) : (
            <SparklesIcon data-icon="inline-start" />
          )}
          {busy ? 'Готовим план' : 'Запустить агента'}
        </Button>
        <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
          {busy ? 'Агент работает…' : error ? 'Запрос не выполнен' : null}
        </p>
      </CardFooter>
    </Card>
  );
}
