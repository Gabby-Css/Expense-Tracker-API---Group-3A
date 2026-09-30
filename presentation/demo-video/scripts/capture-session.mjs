// capture-session.mjs — runs the REAL Expense Tracker API and records a demo session.
// Everything the video shows (requests, responses, status codes, timings, server log lines,
// test results) comes from this capture, so nothing on screen is invented.
//
// Run from the repo root:   node presentation/demo-video/scripts/capture-session.mjs
// It uses a temporary data file + port 3055, so data/express.json is never touched.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..');
const outFile = path.resolve(here, '..', 'assets', 'session.json');
const tmpData = path.join(os.tmpdir(), `expenses-demo-${process.pid}.json`);
const PORT = 3055;
const BASE = `http://localhost:${PORT}`;
const env = { ...process.env, PORT: String(PORT), DATA_FILE: tmpData };
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.writeFileSync(tmpData, '[]');

// 1. seed
const seed = spawnSync(process.execPath, ['src/data/seed.js'], { cwd: repo, env, encoding: 'utf8' });
const seedLine = strip(seed.stdout).trim().replace(tmpData, 'data/express.json');

// 2. start the real server
const server = spawn(process.execPath, ['src/server.js'], { cwd: repo, env });
let logBuf = '';
server.stdout.on('data', (d) => (logBuf += d.toString()));
server.stderr.on('data', (d) => (logBuf += d.toString()));
const takeLog = () => {
  const lines = strip(logBuf).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  logBuf = '';
  return lines;
};
for (let i = 0; i < 40 && !logBuf.includes('running'); i++) await sleep(150);
const startLine = takeLog().find((l) => l.includes('running'))?.replace(`:${PORT}`, ':3000');

const readLedger = () =>
  JSON.parse(fs.readFileSync(tmpData, 'utf8')).map((e) => ({
    id: e.id, title: e.title, amount: e.amount, category: e.category, date: e.date,
  }));

const steps = [];
async function call(key, method, url, body, raw) {
  const t0 = performance.now();
  const res = await fetch(BASE + url, {
    method,
    headers: body || raw ? { 'Content-Type': 'application/json' } : undefined,
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const ms = Math.max(1, Math.round(performance.now() - t0));
  const json = await res.json();
  await sleep(120); // let morgan flush
  const log = takeLog().find((l) => l.startsWith(method)) || '';
  steps.push({
    key, method, url, body: body || null, raw: raw ?? null, status: res.status, statusText: res.statusText || '',
    ms, response: json, log, ledger: readLedger(),
  });
  return json;
}

await call('health', 'GET', '/api/health');
const created = await call('create', 'POST', '/api/expenses', {
  title: 'Group project printing', amount: 35, category: 'Education', date: '2026-09-20',
});
const id = created.data.id;
await call('list', 'GET', '/api/expenses?limit=3');
await call('one', 'GET', `/api/expenses/${id}`);
await call('filter', 'GET', '/api/expenses?category=Education&sort=-amount');
await call('patch', 'PATCH', `/api/expenses/${id}`, { amount: 42.5 });
await call('put', 'PUT', `/api/expenses/${id}`, {
  title: 'Report printing + binding', amount: 60, category: 'Education', date: '2026-09-20',
});
await call('delete', 'DELETE', `/api/expenses/${id}`);
await call('notfound', 'GET', `/api/expenses/${id}`);
await call('summary', 'GET', '/api/expenses/summary');
await call('invalid', 'POST', '/api/expenses', { title: '', amount: -5, category: 'Gaming', date: '2026-02-30' });
await call('categories', 'GET', '/api/categories');
await call('search', 'GET', '/api/expenses?search=lunch');
await call('badjson', 'POST', '/api/expenses', null, '{"title": "Lunch",');
await call('unknown', 'GET', '/api/nothing-here');

server.kill();

// 3. the real test run (spec reporter so each test name + time is captured)
const t = spawnSync(process.execPath, ['--test', '--test-reporter=spec', 'tests/expenses.test.js'], {
  cwd: repo, encoding: 'utf8', env: { ...process.env, DATA_FILE: undefined },
});
const testLines = strip(t.stdout).split(/\r?\n/);
const tests = testLines
  .map((l) => l.match(/^\s*✔ (.+?) \(([\d.]+)ms\)/))
  .filter(Boolean)
  .map((m) => ({ name: m[1], ms: Math.round(parseFloat(m[2])) }));
const summary = {};
for (const l of testLines) {
  const m = l.match(/^ℹ (tests|pass|fail|duration_ms) ([\d.]+)/);
  if (m) summary[m[1]] = parseFloat(m[2]);
}

// wall-clock time of `npm test` exactly as a student would run it (includes npm + node start-up)
const w0 = performance.now();
spawnSync('npm', ['test'], { cwd: repo, shell: true, encoding: 'utf8' });
const testWallMs = Math.round(performance.now() - w0);

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(
  outFile,
  JSON.stringify({ capturedAt: new Date().toISOString(), seedLine, startLine, steps, tests, testSummary: summary, testWallMs }, null, 2),
);
fs.rmSync(tmpData, { force: true });
console.log(`captured ${steps.length} steps, ${tests.length} tests -> ${path.relative(repo, outFile)}`);
