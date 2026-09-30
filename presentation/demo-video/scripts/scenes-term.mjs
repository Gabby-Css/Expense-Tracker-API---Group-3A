// scenes-term.mjs — the five "terminal + ledger" scenes: run, create, read, update, delete.
// Blueprint: prompt-type-submit-generate (a command types, the machine answers) with a persistent
// ledger panel showing data/express.json change after every call.

import { commonCss, chrome, shell, Term, Ledger, renderJson, statusLines, esc } from './lib.mjs';

const TERM_BOX = { x: 80, y: 120, w: 1200, h: 780 };
const LED_BOX = { x: 1320, y: 120, w: 520, h: 780 };
const URL = (u) => `localhost:3000${u}`;
const TITLE = 'terminal - group-3a';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function finish(sc, TL, term, led) {
  const sid = sc.id, S = `[data-composition-id="${sid}"]`;
  const ch = chrome(sid, sc, TL.count);
  const css = commonCss(S) + term.css(S) + led.css(S);
  const body = ch.html + '\n' + term.html() + '\n' + led.html();
  return shell({ sid, dur: sc.dur, css, body, ops: [...ch.ops, ...term.ops, ...led.ops] });
}

// Type a multi-line command sequentially inside [from, to]; returns the end time.
function typeLines(term, lines, from, to) {
  const total = lines.reduce((a, l) => a + l.length, 0);
  const cps = clamp(total / Math.max(0.5, to - from), 26, 60);
  let t = from, end = from;
  lines.forEach((ln, i) => {
    const d = Math.max(0.35, ln.length / cps);
    end = term.type(ln, t, d, { prefix: i === 0 ? '$ ' : '  ', hold: i === lines.length - 1 ? 0.55 : 0.05 });
    t = end + 0.05;
  });
  return end;
}
const one = (term, cmd, from, cps = 44) => term.type(cmd, from, Math.max(0.6, cmd.length / cps));

// ------------------------------------------------------------------ 04 run it
export function s04(sc, TL, D) {
  const sid = sc.id;
  const term = new Term(sid, { ...TERM_BOX, title: TITLE });
  const seed = D.rows.slice(0, 8).map((r) => ({ ...r }));
  const keys = seed.map((r) => r.key);
  const led = new Ledger(sid, LED_BOX, seed, { totals: ['0.00', '1,718.50'], counts: ['0 expenses', '8 expenses'], hidden: keys });

  term.page(sc.T('04a', 0, -0.25));
  let e = term.type('npm install', sc.T('04a', 0.2), 0.75);
  const cm = term.print(['<span class="dim"># installs express, cors and morgan</span>'], e + 0.25);
  term.blank();
  e = term.type('npm run seed', Math.max(sc.T('04a', 0.5), cm + 0.3), 0.85);
  const tOut = Math.max(sc.T('04a', 0.9), e + 0.25);
  const out = term.print([`<span class="s">${esc(D.session.seedLine)}</span>`], tOut);
  led.cascade(keys, tOut + 0.15, 0.1);
  led.setTotal(1, tOut + 1.0);
  led.setCount(1, tOut + 1.0);
  term.blank();
  e = term.type('npm start', Math.max(sc.T('04b', 0.08), out + 0.6), 0.7);
  const tS = Math.max(sc.T('04b', 0.45), e + 0.2);
  term.print([`<span class="mint">${esc(D.session.startLine)}</span>`], tS);
  term.chipSwap(['<span class="dim">idle</span>', '<span class="mint">listening on :3000</span>'], [tS]);
  return finish(sc, TL, term, led);
}

// ------------------------------------------------------------------ 05 create
export function s05(sc, TL, D) {
  const sid = sc.id;
  const term = new Term(sid, { ...TERM_BOX, title: TITLE });
  const led = new Ledger(sid, LED_BOX, D.rows.map((r) => ({ ...r })), { totals: ['1,718.50', '1,753.50'], counts: ['8 expenses', '9 expenses'], hidden: [D.createdKey] });
  const health = D.step('health'), create = D.step('create');

  term.page(sc.T('05a', 0, -0.25));
  let e = one(term, 'curl localhost:3000/api/health', sc.T('05a', 0.1));
  term.print(['', ...statusLines(health), '', ...renderJson(health.response, { sid })], Math.max(e + 0.25, sc.T('05a', 0.55)));

  term.page(sc.T('05b', 0, -0.2));
  const cmd = [
    'curl -X POST localhost:3000/api/expenses \\',
    '  -H "Content-Type: application/json" \\',
    `  -d '{ "title": "${create.body.title}",`,
    `        "amount": ${create.body.amount}, "category": "${create.body.category}",`,
    `        "date": "${create.body.date}" }'`,
  ];
  e = typeLines(term, cmd, sc.T('05b', 0.16), sc.T('05b', 0.96));
  term.print(['', ...statusLines(create), '', ...renderJson(create.response, { sid, marks: { 'data.id': 'newid' } })], Math.max(e + 0.3, sc.T('05c', 0.22)));
  term.mark('newid', sc.T('05c', 0.78));

  const tA = sc.T('05d', 0.06);
  led.add(D.createdKey, tA, 'rgba(74,227,160,.36)');
  led.setTotal(1, tA + 0.3);
  led.setCount(1, tA + 0.3);
  return finish(sc, TL, term, led);
}

// ------------------------------------------------------------------ 06 read
export function s06(sc, TL, D) {
  const sid = sc.id;
  const term = new Term(sid, { ...TERM_BOX, title: TITLE });
  const led = new Ledger(sid, LED_BOX, D.rows.map((r) => ({ ...r })), { totals: ['1,753.50'], counts: ['9 expenses'], hidden: [] });
  const list = D.step('list'), oneS = D.step('one'), filter = D.step('filter'), search = D.step('search'), cats = D.step('categories');
  const idsToKeys = (arr) => arr.map((d) => d.id.slice(0, 8));
  const compact = ['title', 'amount'];

  // 06a: list
  term.page(sc.T('06a', 0, -0.25));
  let e = one(term, `curl "${URL(list.url)}"`, sc.T('06a', 0.12));
  term.print(['', ...statusLines(list), '', ...renderJson(list.response, { sid, compact, marks: { totalAmount: 'l-total', totalPages: 'l-pages' } })], Math.max(e + 0.25, sc.T('06a', 0.5)));
  term.mark('l-total', sc.T('06a', 0.76));
  term.mark('l-pages', sc.T('06a', 0.92));
  led.focus(idsToKeys(list.response.data), sc.T('06a', 0.62));

  // 06b: one by id
  term.page(sc.T('06b', 0, -0.2));
  e = one(term, `curl ${URL(oneS.url)}`, sc.T('06b', 0.04), 50);
  term.print(['', ...statusLines(oneS), '', ...renderJson(oneS.response, { sid })], Math.max(e + 0.25, sc.T('06b', 0.5)));
  led.focus([D.createdKey], sc.T('06b', 0.55));

  // 06c: filter + sort
  term.page(sc.T('06c', 0, -0.2));
  e = one(term, `curl "${URL(filter.url)}"`, sc.T('06c', 0.05));
  term.print(['', ...statusLines(filter), '', ...renderJson(filter.response, { sid, compact })], Math.max(e + 0.25, sc.T('06c', 0.6)));
  led.focus(idsToKeys(filter.response.data), sc.T('06c', 0.62));

  // 06d: search (+ other filters hint)
  term.page(sc.T('06d', 0, -0.2));
  e = one(term, `curl "${URL(search.url)}"`, sc.T('06d', 0.04));
  const end = term.print(['', ...statusLines(search), '', ...renderJson(search.response, { sid, compact })], Math.max(e + 0.25, sc.T('06d', 0.32)));
  led.focus(idsToKeys(search.response.data), sc.T('06d', 0.36));
  term.print(['', '<span class="dim"># also: startDate, endDate, minAmount, maxAmount, sort, page</span>'], Math.max(end + 0.2, sc.T('06d', 0.66)));

  // 06e: categories
  term.page(sc.T('06e', 0, -0.2));
  e = one(term, 'curl localhost:3000/api/categories', sc.T('06e', 0.04));
  term.print(['', ...statusLines(cats), '', ...renderJson(cats.response, { sid })], Math.max(e + 0.25, sc.T('06e', 0.4)));
  led.unfocus(sc.T('06e', 0.3));
  return finish(sc, TL, term, led);
}

// ------------------------------------------------------------------ 07 update
export function s07(sc, TL, D) {
  const sid = sc.id;
  const term = new Term(sid, { ...TERM_BOX, title: TITLE });
  const led = new Ledger(sid, LED_BOX, D.rows.map((r) => ({ ...r })), { totals: ['1,753.50', '1,761.00', '1,778.50'], counts: ['9 expenses'], hidden: [] });
  const patch = D.step('patch'), put = D.step('put');

  term.page(sc.T('07a', 0, -0.25));
  const pcmd = ['curl -X PATCH \\', `  ${URL(patch.url)} \\`, '  -H "Content-Type: application/json" \\', `  -d '{ "amount": ${patch.body.amount} }'`];
  let e = typeLines(term, pcmd, sc.T('07a', 0.5), sc.T('07a', 0.99));
  term.print(['', ...statusLines(patch), '', ...renderJson(patch.response, { sid, marks: { 'data.amount': 'p-amt' } })], Math.max(e + 0.3, sc.T('07b', 0.08)));
  term.mark('p-amt', sc.T('07b', 0.5));
  led.variant(D.createdKey, 1, sc.T('07b', 0.58));
  led.setTotal(1, sc.T('07b', 0.58) + 0.15);

  term.page(sc.T('07c', 0, -0.2));
  const b = put.body;
  const ucmd = [
    'curl -X PUT \\', `  ${URL(put.url)} \\`, '  -H "Content-Type: application/json" \\',
    `  -d '{ "title": "${b.title}",`, `        "amount": ${b.amount}, "category": "${b.category}",`, `        "date": "${b.date}" }'`,
  ];
  e = typeLines(term, ucmd, sc.T('07c', 0.16), sc.T('07c', 0.99));
  const json = renderJson(put.response, {
    sid,
    marks: { 'data.updatedAt': 'u-upd', 'data.createdAt': 'u-cre' },
    notes: { 'data.updatedAt': { id: 'n-upd', text: '# new' }, 'data.createdAt': { id: 'n-cre', text: '# unchanged' } },
  });
  term.print(['', ...statusLines(put), '', ...json], Math.max(e + 0.3, sc.T('07d', 0.02)));
  led.variant(D.createdKey, 2, sc.T('07d', 0.1));
  led.setTotal(2, sc.T('07d', 0.1) + 0.15);
  term.mark('u-upd', sc.T('07d', 0.4));
  term.reveal(`${sid}-nt-n-upd`, sc.T('07d', 0.4));
  term.mark('u-cre', sc.T('07d', 0.76), 'rgba(169,194,181,.30)');
  term.reveal(`${sid}-nt-n-cre`, sc.T('07d', 0.76));
  return finish(sc, TL, term, led);
}

// ------------------------------------------------------------------ 08 delete
export function s08(sc, TL, D) {
  const sid = sc.id;
  const term = new Term(sid, { ...TERM_BOX, title: TITLE });
  const rows = D.rows.map((r) => (r.key === D.createdKey ? { ...r, cur: 2 } : { ...r }));
  const led = new Ledger(sid, LED_BOX, rows, { totals: ['1,778.50', '1,718.50'], counts: ['9 expenses', '8 expenses'], hidden: [] });
  const del = D.step('delete'), nf = D.step('notfound');

  term.page(sc.T('08a', 0, -0.25));
  let e = typeLines(term, ['curl -X DELETE \\', `  ${URL(del.url)}`], sc.T('08a', 0.08), sc.T('08a', 0.5));
  term.print(['', ...statusLines(del), '', ...renderJson(del.response, { sid })], Math.max(e + 0.3, sc.T('08a', 0.56)));
  const tR = Math.max(e + 0.5, sc.T('08a', 0.66));
  led.remove(D.createdKey, tR);
  led.setTotal(1, tR + 0.7);
  led.setCount(1, tR + 0.7);

  term.page(sc.T('08b', 0, -0.2));
  e = one(term, `curl ${URL(nf.url)}`, sc.T('08b', 0.05), 50);
  term.print(['', ...statusLines(nf), '', ...renderJson(nf.response, { sid, marks: { message: 'nf-msg' } })], Math.max(e + 0.25, sc.T('08b', 0.5)));
  term.mark('nf-msg', sc.T('08b', 0.72), 'rgba(255,122,107,.30)');
  return finish(sc, TL, term, led);
}
