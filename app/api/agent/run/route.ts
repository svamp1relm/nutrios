import { runHealthAgent } from '../../../../src/harness/runHealthAgent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type RunBody = { task?: unknown };

export async function POST(request: Request) {
  let body: RunBody | null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Некорректный JSON' }, { status: 400 });
  }

  const task = body?.task;
  if (typeof task !== 'string' || !task.trim()) {
    return Response.json({ error: 'Нужно указать задачу' }, { status: 400 });
  }

  try {
    const result = await runHealthAgent(task.trim());
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
