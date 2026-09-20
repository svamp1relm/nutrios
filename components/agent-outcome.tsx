import { CircleAlertIcon, ShieldAlertIcon } from 'lucide-react';
import type { HealthAgentResult } from '@/src/harness/runHealthAgent';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

type AgentOutcomeProps = {
  status: 'idle' | 'running' | 'result';
  result: HealthAgentResult | null;
  error: string | null;
};

export function AgentOutcome({ status, result, error }: AgentOutcomeProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>Запрос не выполнен</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (status === 'running') {
    return (
      <Card aria-busy="true" aria-live="polite">
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    );
  }

  if (status !== 'result' || !result) {
    return null;
  }

  if (result.review.verdict === 'needs_human_professional') {
    return (
      <Alert variant="destructive">
        <ShieldAlertIcon aria-hidden="true" />
        <AlertTitle>Нужна консультация специалиста</AlertTitle>
        <AlertDescription>
          Этот запрос выходит за рамки безопасного wellness-плана. Обратитесь к квалифицированному специалисту.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
      <CardHeader>
        <CardTitle>План</CardTitle>
        <CardDescription>Черновик привычек, не медицинская рекомендация</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <pre className="max-w-prose whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {result.plan}
        </pre>
        {(result.toolCalls?.length ?? 0) > 0 && (
          <>
            <Separator />
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Что сделал агент
              </h3>
              <ul className="flex flex-wrap gap-2">
                {(result.toolCalls ?? []).map((name, index) => (
                  <li key={`${name}-${index}`}>
                    <Badge variant="outline">{name}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
