import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import './loadEnv.ts';
import { resolveModel } from '../src/harness/model.ts';
import { runHealthAgent } from '../src/harness/runHealthAgent.ts';

type EvalExpect = {
  verdict: 'approve' | 'needs_human_professional';
  minScore?: number;
};

type EvalCase = {
  name: string;
  task: string;
  expect: EvalExpect;
};

type RowStatus = 'PASS' | 'FAIL' | 'SKIP';

function loadCases(): EvalCase[] {
  const dir = join(process.cwd(), 'evals', 'cases');
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8')) as EvalCase;
      if (!parsed.name || !parsed.task || !parsed.expect?.verdict) {
        throw new Error(`Некорректный кейс: ${file}`);
      }
      return parsed;
    });
}

function parseModels(argv: string[]): string[] {
  const models: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--model' || arg === '--models') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error(`${arg} требует значение: имя модели или список через запятую`);
      }
      models.push(...value.split(',').map((item) => item.trim()).filter(Boolean));
      i += 1;
      continue;
    }
    if (arg.startsWith('--model=')) {
      models.push(...arg.slice('--model='.length).split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }
    if (arg.startsWith('--models=')) {
      models.push(...arg.slice('--models='.length).split(',').map((item) => item.trim()).filter(Boolean));
    }
  }
  const unique = [...new Set(models)];
  return unique.length > 0 ? unique : [resolveModel()];
}

function isModelUnavailable(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    /\b403\b/.test(message) ||
    /недоступна для данного API-ключа/i.test(message) ||
    /model .* (not found|unavailable|does not exist)/i.test(message)
  );
}

function judge(evalCase: EvalCase, verdict: string, score: number): { ok: boolean; reason: string } {
  if (verdict !== evalCase.expect.verdict) {
    return { ok: false, reason: `verdict ${verdict} ≠ ${evalCase.expect.verdict}` };
  }
  if (evalCase.expect.minScore !== undefined && score < evalCase.expect.minScore) {
    return { ok: false, reason: `score ${score} < ${evalCase.expect.minScore}` };
  }
  return { ok: true, reason: 'ok' };
}

const cases = loadCases();
const models = parseModels(process.argv.slice(2));
console.log(`Eval: ${cases.length} кейсов × ${models.length} модел${models.length === 1 ? 'ь' : 'и'}, последовательно\n`);

let failed = 0;
let skipped = 0;
const rows: string[][] = [['кейс', 'модель', 'ожидание', 'факт', 'score', 'раунды', 'результат']];

for (const model of models) {
  let modelUnavailable: string | null = null;

  for (const evalCase of cases) {
    process.stdout.write(`→ ${evalCase.name} [${model}] ... `);

    if (modelUnavailable) {
      skipped += 1;
      console.log(`SKIP (${modelUnavailable})`);
      rows.push([evalCase.name, model, evalCase.expect.verdict, 'skip', '—', '—', 'SKIP']);
      continue;
    }

    try {
      const result = await runHealthAgent(evalCase.task, { model });
      const verdict = result.review.verdict;
      const { ok, reason } = judge(evalCase, verdict, result.finalScore);
      if (!ok) failed += 1;
      const mark: RowStatus = ok ? 'PASS' : 'FAIL';
      console.log(`${mark} (${reason})`);
      rows.push([
        evalCase.name,
        model,
        evalCase.expect.verdict,
        verdict,
        String(result.finalScore),
        String(result.rounds.length),
        mark,
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isModelUnavailable(err)) {
        modelUnavailable = message;
        skipped += 1;
        console.log(`SKIP (${message})`);
        rows.push([evalCase.name, model, evalCase.expect.verdict, 'skip', '—', '—', 'SKIP']);
        continue;
      }
      failed += 1;
      console.log(`FAIL (${message})`);
      rows.push([evalCase.name, model, evalCase.expect.verdict, 'error', '—', '—', 'FAIL']);
    }
  }
}

console.log('');
const widths = rows[0].map((_, col) => Math.max(...rows.map((row) => row[col].length)));
for (const [i, row] of rows.entries()) {
  const line = row.map((cell, col) => cell.padEnd(widths[col])).join('  ');
  console.log(line);
  if (i === 0) console.log(widths.map((w) => '-'.repeat(w)).join('  '));
}

const total = cases.length * models.length;
const passed = total - failed - skipped;
console.log(`\n${passed}/${total} PASS${skipped > 0 ? `, ${skipped} SKIP` : ''}`);
if (failed > 0) process.exit(1);

