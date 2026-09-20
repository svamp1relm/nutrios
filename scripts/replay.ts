import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import './loadEnv.ts';
import { runHealthAgent } from '../src/harness/runHealthAgent.ts';
import type { RunTrace } from '../src/harness/traceRun.ts';

function usage(): never {
  console.error('Использование: npm run replay -- runs/run-XXX.json');
  process.exit(1);
}

function loadTrace(filePath: string): RunTrace {
  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as RunTrace;
  if (!raw?.task) throw new Error(`В ${filePath} нет поля task`);
  return raw;
}

function fmtList(values: string[] | undefined): string {
  return values?.length ? values.join(', ') : '—';
}

function fmtVersions(versions: RunTrace['promptVersions'] | undefined): string {
  if (!versions) return '—';
  return `coach=${versions.coach} reviewer=${versions.reviewer}`;
}

const fileArg = process.argv[2];
if (!fileArg) usage();

const tracePath = resolve(process.cwd(), fileArg);
const oldTrace = loadTrace(tracePath);

console.log(`Replay: ${tracePath}`);
console.log(`Задача: ${oldTrace.task}\n`);

const fresh = await runHealthAgent(oldTrace.task);

const oldVerdict = oldTrace.verdict ?? '—';
const newVerdict = fresh.review.verdict;
const oldRounds = oldTrace.rounds?.length ?? 0;
const newRounds = fresh.rounds.length;

const rows = [
  ['поле', 'старый', 'новый', 'изменилось'],
  ['verdict', String(oldVerdict), newVerdict, oldVerdict === newVerdict ? 'нет' : 'да'],
  [
    'score',
    String(oldTrace.finalScore),
    String(fresh.finalScore),
    oldTrace.finalScore === fresh.finalScore ? 'нет' : 'да',
  ],
  ['раунды', String(oldRounds), String(newRounds), oldRounds === newRounds ? 'нет' : 'да'],
  [
    'toolCalls',
    fmtList(oldTrace.toolCalls),
    fmtList(fresh.toolCalls),
    JSON.stringify(oldTrace.toolCalls ?? []) === JSON.stringify(fresh.toolCalls) ? 'нет' : 'да',
  ],
  [
    'promptVersions',
    fmtVersions(oldTrace.promptVersions),
    fmtVersions(fresh.promptVersions),
    JSON.stringify(oldTrace.promptVersions) === JSON.stringify(fresh.promptVersions) ? 'нет' : 'да',
  ],
];

const widths = rows[0].map((_, col) => Math.max(...rows.map((row) => row[col].length)));
for (const [i, row] of rows.entries()) {
  const line = row.map((cell, col) => cell.padEnd(widths[col])).join('  ');
  console.log(line);
  if (i === 0) console.log(widths.map((w) => '-'.repeat(w)).join('  '));
}
