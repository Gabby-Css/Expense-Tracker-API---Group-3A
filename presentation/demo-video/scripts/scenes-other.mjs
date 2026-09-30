// scenes-other.mjs — the bespoke scenes: hook, what, flow, summary, invalid, tests, team, close.

import { commonCss, chrome, shell, Term, renderJson, statusLines, esc, f3, el, money, CHECK, CAT } from './lib.mjs';

const ft = (id, from, to, at) => `tl.fromTo(${el(id)},${JSON.stringify(from)},${JSON.stringify(to)},${f3(at)});`;
const tw = (id, to, at) => `tl.to(${el(id)},${JSON.stringify(to)},${f3(at)});`;
const st = (id, vars, at) => `tl.set(${el(id)},${JSON.stringify(vars)},${f3(at)});`;
const scope = (sid) => `[data-composition-id="${sid}"]`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function build(sc, TL, { css = '', body = '', ops = [], extraCss = '' }) {
  const sid = sc.id, S = scope(sid);
  const ch = chrome(sid, sc, TL.count);
  return shell({ sid, dur: sc.dur, css: commonCss(S) + extraCss + css, body: ch.html + '\n' + body, ops: [...ch.ops, ...ops] });
}

// masked line reveal helper: <div class="mk"><span id=..>TEXT</span></div>
const maskCss = (S) => `
${S} .mk{overflow:hidden;line-height:1.02;padding:0 0 .08em 0}
${S} .mk>span{display:block;will-change:transform}
`;
const maskIn = (id, at, dur = 0.55) => ft(id, { yPercent: 115 }, { yPercent: 0, duration: dur, ease: 'power3.out' }, at);
const maskOut = (id, at, dur = 0.35) => tw(id, { yPercent: -115, duration: dur, ease: 'power2.in' }, at);

// ================================================================== 01 hook
export function s01(sc, TL, D) {
  const sid = sc.id, S = scope(sid);
  const seed = D.seedRows;
  const tape = [...seed, ...seed, ...seed].map((r) => `<div class="tp"><span>${esc(r.title)}</span><span>${money(r.amount)}</span></div>`).join('');
  const A = ['WHERE DID', 'YOUR <b>MONEY</b>', 'GO THIS', 'MONTH?'];
  const B = ['SO WE BUILT', 'AN <b>API</b> THAT', 'KEEPS THE', 'BOOKS.'];
  const Cc = ['EXPENSE', 'TRACKER', '<b>API</b>'];
  const lines = (arr, key, cls) => arr.map((t, i) => `<div class="mk ${cls}"><span id="${sid}-${key}${i}">${t}</span></div>`).join('');
  const css = maskCss(S) + `
${S} .col{position:absolute;left:80px;top:150px;width:1100px}
${S} .ph{position:absolute;left:0;top:0;width:1100px}
${S} .big{font-size:130px;color:var(--paper)}
${S} .big b{font-weight:400;color:var(--gold)}
${S} .mid{font-size:118px;color:var(--paper)}
${S} .mid b{font-weight:400;color:var(--gold)}
${S} .ttl{font-size:184px;color:var(--paper)}
${S} .ttl b{font-weight:400;color:var(--gold)}
${S} .small{font-size:42px;letter-spacing:.06em;color:var(--dim);text-transform:uppercase;margin-bottom:26px}
${S} .tag{font-size:30px;letter-spacing:.24em;color:var(--gold);font-weight:700;margin-bottom:22px}
${S} .sub{font-size:30px;letter-spacing:.14em;color:var(--dim);margin-top:34px;text-transform:uppercase}
${S} .tape{position:absolute;left:1340px;top:120px;width:500px;height:790px;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 12%,#000 88%,transparent 100%);mask-image:linear-gradient(to bottom,transparent 0,#000 12%,#000 88%,transparent 100%)}
${S} .tape-in{position:absolute;left:0;top:0;width:500px}
${S} .tp{display:flex;justify-content:space-between;height:64px;align-items:center;font-size:24px;color:var(--dim);border-bottom:2px dashed rgba(169,194,181,.28)}
${S} .tape-lbl{position:absolute;left:1340px;top:924px;font-size:20px;letter-spacing:.14em;color:var(--dim);text-transform:uppercase}
`;
  const body = `
<div class="col">
  <div class="ph" id="${sid}-pA">${lines(A, 'a', 'disp big')}</div>
  <div class="ph" id="${sid}-pB"><div class="small" id="${sid}-bs">Most students can't say.</div>${lines(B, 'b', 'disp mid')}</div>
  <div class="ph" id="${sid}-pC"><div class="tag" id="${sid}-ct">GROUP 3A</div>${lines(Cc, 'c', 'disp ttl')}<div class="sub" id="${sid}-cs">REST API - Node.js - Express</div></div>
</div>
<div class="tape"><div class="tape-in" id="${sid}-tape">${tape}</div></div>`;
  const ops = [];
  // ledger tape: scrolls up exactly one cycle (8 rows) over the scene
  ops.push(ft(`${sid}-tape`, { y: 0 }, { y: -8 * 64, duration: sc.dur, ease: 'none' }, 0));
  // phase A
  ops.push(st(`${sid}-pB`, { opacity: 0 }, 0), st(`${sid}-pC`, { opacity: 0 }, 0));
  A.forEach((_, i) => ops.push(maskIn(`${sid}-a${i}`, sc.T('01a', 0.02 + i * 0.16))));
  const tB = sc.T('01b', 0, -0.05);
  A.forEach((_, i) => ops.push(maskOut(`${sid}-a${i}`, tB - 0.4 + i * 0.05)));
  ops.push(st(`${sid}-pA`, { opacity: 0 }, tB - 0.02), st(`${sid}-pB`, { opacity: 1 }, tB - 0.02));
  // phase B
  ops.push(ft(`${sid}-bs`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, sc.T('01b', 0.02)));
  [0.3, 0.46, 0.66, 0.8].forEach((f, i) => ops.push(maskIn(`${sid}-b${i}`, sc.T('01b', f))));
  const tC = sc.T('01c', 0, -0.05);
  ops.push(tw(`${sid}-bs`, { opacity: 0, duration: 0.25 }, tC - 0.4));
  B.forEach((_, i) => ops.push(maskOut(`${sid}-b${i}`, tC - 0.4 + i * 0.05)));
  ops.push(st(`${sid}-pB`, { opacity: 0 }, tC - 0.02), st(`${sid}-pC`, { opacity: 1 }, tC - 0.02));
  // phase C
  ops.push(ft(`${sid}-ct`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, sc.T('01c', 0.0)));
  [0.1, 0.26, 0.42].forEach((f, i) => ops.push(maskIn(`${sid}-c${i}`, sc.T('01c', f), 0.6)));
  ops.push(ft(`${sid}-cs`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, sc.T('01c', 0.62)));
  return build(sc, TL, { css, body, ops });
}

// ================================================================== 02 what it is
export function s02(sc, TL, D) {
  const sid = sc.id;
  const r0 = D.seedRows[0];
  const chips = ['REST API', 'Node.js', 'Express', 'JSON file'];
  const fields = [['title', r0.title], ['amount', money(r0.amount)], ['category', r0.category], ['date', '2026-09-01']];
  const verbs = [['CREATE', 'POST'], ['READ', 'GET'], ['UPDATE', 'PUT / PATCH'], ['DELETE', 'DELETE']];
  const extras = ['FILTER', 'SEARCH', 'SORT', 'TOTAL'];
  const rec = D.step('search').response.data[0]; // the real seeded Lunch record, id and timestamps included
  const jl = renderJson(rec, { sid });
  const css = `
${scope(sid)} .jp{position:absolute;left:1030px;top:230px;width:810px;height:640px;border-radius:16px;background:var(--panel);border:2px solid var(--hair)}
${scope(sid)} .jp-h{position:absolute;left:28px;top:24px;font-size:20px;letter-spacing:.16em;color:var(--dim);text-transform:uppercase}
${scope(sid)} .jl{position:absolute;left:28px;white-space:pre;font-size:26px;line-height:44px;color:var(--paper)}
${scope(sid)} .jl .k{color:var(--dim)} ${scope(sid)} .jl .s{color:var(--paper)} ${scope(sid)} .jl .n{color:var(--gold)} ${scope(sid)} .jl .p{color:var(--punct)}
${scope(sid)} .chips{position:absolute;left:80px;top:130px;display:flex;gap:18px}
${scope(sid)} .chip{border:2px solid var(--hair);border-radius:999px;padding:10px 26px;font-size:28px;color:var(--paper);background:var(--panel);white-space:nowrap}
${scope(sid)} .chip.hot{border-color:var(--gold);color:var(--gold)}
${scope(sid)} .card{position:absolute;left:80px;top:230px;width:880px;height:640px;border-radius:16px;background:var(--panel);border:2px solid var(--hair)}
${scope(sid)} .card-h{position:absolute;left:36px;top:24px;font-size:20px;letter-spacing:.16em;color:var(--dim);text-transform:uppercase}
${scope(sid)} .fld{position:absolute;left:36px;right:36px;height:104px;border-bottom:1px solid var(--hair)}
${scope(sid)} .fld-l{position:absolute;left:0;top:18px;font-size:20px;letter-spacing:.16em;color:var(--dim);text-transform:uppercase}
${scope(sid)} .fld-v{position:absolute;left:0;top:46px;font-size:40px;color:var(--paper);font-weight:700;white-space:nowrap}
${scope(sid)} .save{position:absolute;left:36px;right:36px;bottom:26px;height:92px;border-radius:12px;background:var(--raised);border:2px dashed var(--gold);display:flex;align-items:center;justify-content:space-between;padding:0 28px;font-size:28px;color:var(--paper)}
${scope(sid)} .save b{color:var(--gold);font-weight:700;font-size:24px;letter-spacing:.1em}
${scope(sid)} .vb{position:absolute;left:1030px;width:810px;height:118px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--hair)}
${scope(sid)} .vb-n{font-size:78px;color:var(--paper)}
${scope(sid)} .vb-m{font-family:"IBM Plex Mono",monospace;font-size:28px;color:var(--gold);font-weight:700;letter-spacing:.06em}
${scope(sid)} .ex{position:absolute;left:1030px;top:770px;display:flex;gap:16px}
${scope(sid)} .ex span{border:2px solid var(--hair);border-radius:12px;padding:10px 20px;font-size:26px;color:var(--dim);letter-spacing:.06em;background:var(--panel)}
`;
  const body = `
<div class="chips">${chips.map((c, i) => `<span class="chip${i === 3 ? ' hot' : ''}" id="${sid}-chip${i}">${c}</span>`).join('')}</div>
<div class="card" id="${sid}-card">
  <div class="card-h">one expense</div>
  ${fields.map((f, i) => `<div class="fld" id="${sid}-f${i}" style="top:${70 + i * 104}px"><div class="fld-l">${f[0]}</div><div class="fld-v">${i === 2 ? `<i style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${CAT[f[1]]};margin-right:14px"></i>` : ''}${esc(f[1])}</div></div>`).join('')}
  <div class="save" id="${sid}-save"><span>-&gt; data/express.json</span><b>NO DATABASE TO INSTALL</b></div>
</div>
<div class="jp" id="${sid}-jp"><div class="jp-h">as saved in data/express.json</div>${jl.map((h, i) => `<div class="jl" id="${sid}-jl${i}" style="top:${76 + i * 46}px">${h}</div>`).join('')}</div>
${verbs.map((v, i) => `<div class="vb disp" id="${sid}-v${i}" style="top:${230 + i * 128}px"><span class="vb-n">${v[0]}</span><span class="vb-m">${v[1]}</span></div>`).join('')}
<div class="ex" id="${sid}-ex">${extras.map((e, i) => `<span id="${sid}-ex${i}">${e}</span>`).join('')}</div>`;
  const ops = [];
  chips.slice(0, 3).forEach((_, i) => ops.push(ft(`${sid}-chip${i}`, { opacity: 0, y: 16, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, sc.T('02a', 0.18 + i * 0.2))));
  ops.push(ft(`${sid}-card`, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, sc.T('02b', 0.02)));
  [0.1, 0.26, 0.42, 0.56].forEach((f, i) => ops.push(ft(`${sid}-f${i}`, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, sc.T('02b', f))));
  ops.push(ft(`${sid}-chip3`, { opacity: 0, y: 16, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, sc.T('02b', 0.66)));
  ops.push(ft(`${sid}-save`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, sc.T('02b', 0.74)));
  // right-hand JSON preview: each field appears as it is named, then the fields the API adds itself
  ops.push(ft(`${sid}-jp`, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, sc.T('02b', 0.06)));
  const jt = { 0: 0.08, 9: 0.08, 2: 0.1, 3: 0.26, 4: 0.42, 5: 0.56, 1: 0.74, 6: 0.78, 7: 0.82, 8: 0.86 };
  Object.entries(jt).forEach(([i, f]) => ops.push(ft(`${sid}-jl${i}`, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, sc.T('02b', f))));
  ops.push(tw(`${sid}-jp`, { opacity: 0, x: 30, duration: 0.3, ease: 'power2.in' }, sc.T('02c', 0, -0.32)));
  [0.05, 0.19, 0.3, 0.42].forEach((f, i) => ops.push(ft(`${sid}-v${i}`, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, sc.T('02c', f))));
  [0.56, 0.68, 0.8, 0.9].forEach((f, i) => ops.push(ft(`${sid}-ex${i}`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, sc.T('02c', f))));
  return build(sc, TL, { css, body, ops });
}

// ================================================================== 03 how a request flows
export function s03(sc, TL, D) {
  const sid = sc.id, S = scope(sid);
  const nodes = [
    ['Client', 'curl / Postman', '&gt;_'],
    ['Routes', 'expenseRoutes.js', '/'],
    ['Validate', 'validateExpense.js', 'OK?'],
    ['Controller', 'expenseController.js', 'f(x)'],
    ['Data', 'db.js + express.json', '{ }'],
  ];
  const NW = 290, GAP = 77, X0 = 80, NY = 340, NH = 250;
  const cx = (i) => X0 + i * (NW + GAP) + NW / 2;
  const css = `
${S} .nd{position:absolute;top:${NY}px;width:${NW}px;height:${NH}px;border-radius:16px;background:var(--panel);border:2px solid var(--hair)}
${S} .nd-i{position:absolute;left:0;right:0;top:36px;text-align:center;font-size:58px;color:var(--gold)}
${S} .nd-n{position:absolute;left:0;right:0;top:128px;text-align:center;font-size:36px;color:var(--paper)}
${S} .nd-f{position:absolute;left:0;right:0;top:190px;text-align:center;font-size:19px;color:var(--dim);letter-spacing:.02em}
${S} .nd-lit{position:absolute;inset:-2px;border-radius:16px;border:3px solid var(--gold);background:rgba(245,184,65,.12);opacity:0}
${S} .arw{position:absolute;top:${NY + NH / 2 - 2}px;width:${GAP - 24}px;height:4px;background:var(--hair);border-radius:2px}
${S} .arw::after{content:"";position:absolute;right:-2px;top:-8px;border-left:14px solid var(--hair);border-top:10px solid transparent;border-bottom:10px solid transparent}
${S} .pk{position:absolute;height:48px;line-height:48px;border-radius:999px;padding:0 24px;font-size:24px;font-weight:700;white-space:nowrap}
${S} .pk.go{background:var(--gold);color:#0A2A21;top:${NY - 92}px}
${S} .pk.back{background:var(--mint);color:#0A2A21;top:${NY + NH + 44}px}
${S} .lane{position:absolute;left:${X0}px;width:${5 * NW + 4 * GAP}px;height:2px;background:repeating-linear-gradient(to right,rgba(169,194,181,.35) 0,rgba(169,194,181,.35) 10px,transparent 10px,transparent 20px)}
${S} .err{position:absolute;left:${cx(2) - 250}px;top:${NY + NH + 138}px;width:${cx(3) - cx(2) + 500}px;height:84px;border-radius:12px;border:2px dashed var(--coral);display:flex;align-items:center;justify-content:center;gap:22px;font-size:26px;color:var(--paper)}
${S} .err b{color:var(--coral);font-weight:700}
`;
  const body = `
<div class="lane" style="top:${NY - 44}px"></div><div class="lane" style="top:${NY + NH + 68}px"></div>
${nodes.map((n, i) => `<div class="nd" id="${sid}-n${i}" style="left:${X0 + i * (NW + GAP)}px"><div class="nd-lit" id="${sid}-lit${i}"></div><div class="nd-i disp">${n[2]}</div><div class="nd-n disp">${n[0]}</div><div class="nd-f">${n[1]}</div></div>`).join('')}
${[0, 1, 2, 3].map((i) => `<div class="arw" id="${sid}-a${i}" style="left:${X0 + i * (NW + GAP) + NW + 12}px"></div>`).join('')}
<div class="pk go" id="${sid}-pkg" style="left:${cx(0) - 154}px">POST /api/expenses</div>
<div class="pk back" id="${sid}-pkb" style="left:${cx(4) - 96}px">201 + JSON</div>
<div class="err" id="${sid}-err"><b>errorHandlers.js</b><span>every error becomes clean JSON</span></div>`;
  const ops = [];
  nodes.forEach((_, i) => ops.push(ft(`${sid}-n${i}`, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, sc.T('03a', 0.06 + i * 0.13))));
  [0, 1, 2, 3].forEach((i) => ops.push(ft(`${sid}-a${i}`, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.3, ease: 'power2.out', transformOrigin: '0 50%' }, sc.T('03a', 0.3 + i * 0.13))));
  // forward packet: x is animated relative to its start (client), hopping node to node
  const px = (i) => cx(i) - cx(0);
  ops.push(ft(`${sid}-pkg`, { opacity: 0, x: 0 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, sc.T('03b', 0.0)));
  [[1, 0.2], [2, 0.5], [3, 0.78]].forEach(([i, f]) => {
    ops.push(`tl.to(${el(`${sid}-pkg`)},{x:${px(i)},duration:.55,ease:'power2.inOut'},${f3(sc.T('03b', f))});`);
    ops.push(ft(`${sid}-lit${i}`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, sc.T('03b', f) + 0.4));
  });
  ops.push(`tl.to(${el(`${sid}-pkg`)},{x:${px(4)},duration:.55,ease:'power2.inOut'},${f3(sc.T('03c', 0.05))});`);
  ops.push(ft(`${sid}-lit4`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, sc.T('03c', 0.05) + 0.4));
  ops.push(tw(`${sid}-pkg`, { opacity: 0, duration: 0.3 }, sc.T('03c', 0.05) + 0.62));
  // return packet, right to left
  const back = sc.T('03c', 0.26);
  ops.push(ft(`${sid}-pkb`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, back));
  ops.push(`tl.to(${el(`${sid}-pkb`)},{x:${cx(0) - cx(4)},duration:${f3(Math.max(1.2, sc.D('03c') * 0.55))},ease:'power2.inOut'},${f3(back + 0.2)});`);
  ops.push(ft(`${sid}-err`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, sc.T('03c', 0.86)));
  return build(sc, TL, { css, body, ops });
}

// ================================================================== 09 summary
export function s09(sc, TL, D) {
  const sid = sc.id, S = scope(sid);
  const step = D.step('summary'), sum = step.response.data;
  const cats = Object.entries(sum.byCategory).sort((a, b) => b[1].total - a[1].total);
  const max = cats[0][1].total, BAR_W = 440;
  const term = new Term(sid, { x: 1020, y: 120, w: 820, h: 780, title: 'terminal - group-3a', id: 'tm' });
  const cmd = 'curl localhost:3000/api/expenses/summary';
  term.page(sc.T('09a', 0, -0.2));
  let e = term.type(cmd, sc.T('09a', 0.1), 0.95);
  term.print(['', ...statusLines(step), '', ...renderJson(step.response, { sid, inlineFrom: 3 })], Math.max(e + 0.25, sc.T('09b', 0.05)), { stagger: 0.06 });
  const css = term.css(S) + `
${S} .lbl{position:absolute;left:80px;top:122px;font-size:22px;letter-spacing:.18em;color:var(--dim);text-transform:uppercase}
${S} .tot{position:absolute;left:80px;top:184px;width:900px;height:180px;font-size:156px;line-height:180px;color:var(--gold);font-variant-numeric:tabular-nums;white-space:nowrap}
${S} .tot span{position:absolute;left:0;top:0}
${S} .stat{position:absolute;left:80px;top:386px;font-size:32px;color:var(--paper);white-space:nowrap}
${S} .stat b{color:var(--gold);font-weight:700}
${S} .br{position:absolute;left:80px;width:900px;height:58px}
${S} .br-l{position:absolute;left:0;top:0;width:240px;height:58px;line-height:58px;font-size:24px;color:var(--dim)}
${S} .br-b{position:absolute;left:250px;top:14px;height:30px;width:${BAR_W}px;border-radius:6px;background:var(--dim);transform-origin:0 50%}
${S} .br-v{position:absolute;top:0;height:58px;line-height:58px;font-size:24px;color:var(--paper);font-variant-numeric:tabular-nums;white-space:nowrap}
`;
  const barTop = 460;
  const rowsHtml = cats.map(([name, v], i) => {
    const w = Math.max(6, Math.round((v.total / max) * BAR_W));
    return `<div class="br" id="${sid}-br${i}" style="top:${barTop + i * 62}px"><div class="br-l">${name}</div><div class="br-b" id="${sid}-bb${i}" style="width:${w}px"></div><div class="br-v" style="left:${250 + w + 16}px">${money(v.total)}</div></div>`;
  }).join('');
  const body = `
<div class="lbl">total spent</div>
<div class="tot disp"><span id="${sid}-cnt">0.00</span><span id="${sid}-fin" style="opacity:0">${money(sum.totalAmount)}</span></div>
<div class="stat" id="${sid}-stat"><b>${sum.totalExpenses}</b> expenses &nbsp;-&nbsp; average <b>${money(sum.averageExpense)}</b></div>
${rowsHtml}
${term.html()}`;
  const ops = [...term.ops];
  // count-up: cosmetic onUpdate text, exact final value swapped in by a property set at the end
  const tc = sc.T('09a', 0.62), td = 1.7;
  ops.push(`const o9={v:0};tl.to(o9,{v:${sum.totalAmount},duration:${td},ease:'power3.out',onUpdate:function(){${el(`${sid}-cnt`)}.textContent=o9.v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}},${f3(tc)});`);
  ops.push(st(`${sid}-cnt`, { opacity: 0 }, tc + td), st(`${sid}-fin`, { opacity: 1 }, tc + td));
  ops.push(ft(`${sid}-stat`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, sc.T('09b', 0.28)));
  cats.forEach((_, i) => {
    const t = sc.T('09b', 0.38 + i * 0.07);
    ops.push(ft(`${sid}-br${i}`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t));
    ops.push(ft(`${sid}-bb${i}`, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, t));
  });
  // 09c: Housing is the big one
  const t9c = sc.T('09c', 0.45);
  ops.push(tw(`${sid}-bb0`, { backgroundColor: '#F5B841', duration: 0.35 }, t9c));
  cats.slice(1).forEach((_, i) => ops.push(tw(`${sid}-br${i + 1}`, { opacity: 0.4, duration: 0.35 }, t9c)));
  return build(sc, TL, { css, body, ops });
}

// ================================================================== 10 bad input
export function s10(sc, TL, D) {
  const sid = sc.id, S = scope(sid);
  const inv = D.step('invalid'), bj = D.step('badjson'), un = D.step('unknown');
  const b = inv.body;
  const fields = [
    ['title', JSON.stringify(b.title)], ['amount', String(b.amount)], ['category', JSON.stringify(b.category)], ['date', JSON.stringify(b.date)],
  ];
  const errs = inv.response.errors;
  const badge = (n, id) => `<i class="bd"${id ? ` id="${id}"` : ''}>${n}</i>`;
  const css = `
${S} .cd{position:absolute;border-radius:16px;background:var(--panel);border:2px solid var(--hair);overflow:hidden}
${S} .cd-h{position:absolute;left:0;right:0;top:0;height:52px;background:var(--raised);display:flex;align-items:center;justify-content:space-between;padding:0 24px;font-size:20px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
${S} .cd-h b{color:var(--gold);font-weight:700}
${S} .ln2{position:absolute;left:36px;right:36px;height:58px;line-height:58px;font-size:30px;white-space:pre}
${S} .ln2 .k{color:var(--dim)} ${S} .ln2 .s{color:var(--paper)} ${S} .ln2 .n{color:var(--gold)} ${S} .ln2 .p{color:var(--punct)}
${S} .bd{position:absolute;right:0;top:9px;width:40px;height:40px;line-height:40px;border-radius:50%;background:var(--coral);color:#0A2A21;font-style:normal;font-weight:700;font-size:24px;text-align:center}
${S} .bad-u{position:absolute;left:0;right:0;bottom:1px;height:3px;background:var(--coral);transform-origin:0 50%}
${S} .big4{position:absolute;left:40px;top:76px;font-size:150px;line-height:160px;color:var(--coral)}
${S} .big4s{position:absolute;left:400px;top:120px;font-size:30px;letter-spacing:.12em;color:var(--paper);text-transform:uppercase;line-height:44px}
${S} .msg{position:absolute;left:40px;top:250px;font-size:28px;color:var(--paper);white-space:pre}
${S} .er{position:absolute;left:40px;right:40px;font-size:25px;line-height:36px;color:var(--paper)}
${S} .er .bd{left:0;right:auto;top:0;width:34px;height:34px;line-height:34px;font-size:20px}
${S} .er span{display:block;padding-left:56px}
${S} .mini{position:absolute;top:210px;width:860px;height:440px}
${S} .mini .code{position:absolute;left:40px;top:96px;font-size:56px;color:var(--coral);line-height:64px}
${S} .mini .reason{position:absolute;left:40px;right:40px;top:180px;font-size:32px;line-height:46px;color:var(--paper)}
${S} .mini .rq{position:absolute;left:40px;right:40px;top:290px;font-size:28px;line-height:42px;color:var(--dim);white-space:pre}
${S} .mini .log{position:absolute;left:40px;right:40px;bottom:30px;font-size:22px;color:var(--dim)}
`;
  const body = `
<div class="cd" id="${sid}-req" style="left:80px;top:140px;width:720px;height:640px">
  <div class="cd-h"><span>request</span><b>POST /api/expenses</b></div>
  <div class="ln2" style="top:84px"><span class="p">{</span></div>
  ${fields.map((f, i) => `<div class="ln2" id="${sid}-fl${i}" style="top:${142 + i * 62}px">  <span class="k">"${f[0]}"</span><span class="p">: </span><span class="${i === 1 ? 'n' : 's'}">${esc(f[1])}</span><span class="p">${i < 3 ? ',' : ''}</span>${badge(i + 1, `${sid}-fb${i}`)}<span class="bad-u" id="${sid}-bu${i}"></span></div>`).join('')}
  <div class="ln2" style="top:${142 + 4 * 62}px"><span class="p">}</span></div>
</div>
<div class="cd" id="${sid}-res" style="left:860px;top:140px;width:980px;height:640px">
  <div class="cd-h"><span>response</span><b>0.5 ms</b></div>
  <div class="big4 disp" id="${sid}-b4">400</div><div class="big4s" id="${sid}-b4s">Bad<br>Request</div>
  <div class="msg" id="${sid}-msg"><span class="k" style="color:var(--dim)">"message"</span><span class="p">: </span><span>"Validation failed"</span></div>
  ${errs.map((t, i) => `<div class="er" id="${sid}-er${i}" style="top:${312 + [0, 44, 88, 206][i]}px">${badge(i + 1)}<span>${esc(t)}</span></div>`).join('')}
</div>
<div class="cd mini" id="${sid}-m0" style="left:80px"><div class="cd-h"><span>broken json</span><b>POST /api/expenses</b></div>
  <div class="code disp">${bj.status}</div><div class="reason">${esc(bj.response.message)}</div>
  <div class="rq">body sent:  { "title": "Lunch",<br>(the closing brace is missing)</div></div>
<div class="cd mini" id="${sid}-m1" style="left:960px"><div class="cd-h"><span>unknown route</span><b>GET /api/nothing-here</b></div>
  <div class="code disp">${un.status}</div><div class="reason">${esc(un.response.message)}</div>
  <div class="log">${esc(un.log)}</div></div>`;
  const ops = [];
  ops.push(ft(`${sid}-req`, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, sc.T('10a', 0.02)));
  [0.24, 0.42, 0.6, 0.8].forEach((f, i) => {
    ops.push(ft(`${sid}-fl${i}`, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }, sc.T('10a', f)));
  });
  // flags (numbered badge + coral underline) land after each field has been spoken about
  fields.forEach((_, i) => {
    const tt = sc.T('10a', [0.34, 0.52, 0.7, 0.9][i]);
    ops.push(ft(`${sid}-bu${i}`, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power2.out' }, tt));
    ops.push(ft(`${sid}-fb${i}`, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, tt));
  });
  ops.push(ft(`${sid}-res`, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, sc.T('10b', 0.02)));
  ops.push(ft(`${sid}-b4`, { opacity: 0, scale: 0.7, transformOrigin: '0 50%' }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }, sc.T('10b', 0.08)));
  ops.push(ft(`${sid}-b4s`, { opacity: 0 }, { opacity: 1, duration: 0.4 }, sc.T('10b', 0.16)));
  ops.push(ft(`${sid}-msg`, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4 }, sc.T('10b', 0.3)));
  [0.45, 0.58, 0.7, 0.84].forEach((f, i) => ops.push(ft(`${sid}-er${i}`, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, sc.T('10b', f))));
  // 10c: swap to the two mini exchanges
  const t10c = sc.T('10c', 0, -0.35);
  ops.push(tw(`${sid}-req`, { opacity: 0, duration: 0.3 }, t10c), tw(`${sid}-res`, { opacity: 0, duration: 0.3 }, t10c));
  ops.push(ft(`${sid}-m0`, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, sc.T('10c', 0.05)));
  ops.push(ft(`${sid}-m1`, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, sc.T('10c', 0.42)));
  return build(sc, TL, { css, body, ops });
}

// ================================================================== 11 tests
export function s11(sc, TL, D) {
  const sid = sc.id, S = scope(sid);
  const tests = D.session.tests, sumry = D.session.testSummary;
  const term = new Term(sid, { x: 80, y: 120, w: 1100, h: 780, title: 'terminal - group-3a', id: 'tm', fs: 22 });
  term.page(sc.T('11a', 0, -0.2));
  let e = term.type('npm test', sc.T('11a', 0.04), 0.7);
  const rowsHtml = tests.map((t) => `<span class="ok">${CHECK}</span> ${esc(t.name.padEnd(56))}<span class="dim">${String(t.ms).padStart(4)} ms</span>`);
  const t0 = Math.max(e + 0.3, sc.T('11a', 0.3)), t1 = sc.T('11a', 0.98);
  const stag = (t1 - t0) / tests.length;
  term.print(['', ...rowsHtml], t0 - stag, { stagger: stag, dur: 0.18 });
  const tEnd = sc.T('11c', 0.1);
  term.print(['', `<span class="dim">tests </span><span class="n">${sumry.tests}</span>   <span class="dim">pass </span><span class="t">${sumry.pass}</span>   <span class="dim">fail </span><span class="n">${sumry.fail}</span>`], tEnd, { stagger: 0.15 });
  const secs = (D.session.testWallMs / 1000).toFixed(1);
  const css = term.css(S) + `
${S} .ok{color:var(--mint);display:inline-block;width:26px;vertical-align:middle;margin-right:2px}
${S} .ok svg{display:block;margin-top:-2px}
${S} .cd{position:absolute;left:1220px;top:120px;width:620px;height:780px;border-radius:16px;background:var(--panel);border:2px solid var(--hair);overflow:hidden}
${S} .cd-h{position:absolute;left:0;right:0;top:0;height:52px;background:var(--raised);display:flex;align-items:center;padding:0 24px;font-size:20px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
${S} .big{position:absolute;left:0;right:0;top:130px;height:220px;text-align:center;font-size:190px;line-height:220px;color:var(--mint);font-variant-numeric:tabular-nums;white-space:nowrap}
${S} .big span{position:absolute;left:0;right:0;top:0}
${S} .big-l{position:absolute;left:0;right:0;top:404px;text-align:center;font-size:28px;letter-spacing:.2em;color:var(--paper);text-transform:uppercase}
${S} .stt{position:absolute;left:44px;right:44px;height:64px;border-top:1px solid var(--hair);display:flex;align-items:center;justify-content:space-between;font-size:26px;color:var(--dim)}
${S} .stt b{color:var(--paper);font-weight:700;font-size:34px}
${S} .stt b.g{color:var(--mint)}
${S} .glow{position:absolute;left:60px;right:60px;top:110px;height:280px;border-radius:50%;background:radial-gradient(circle at 50% 50%,rgba(74,227,160,.28) 0%,rgba(74,227,160,0) 70%);opacity:0}
`;
  const body = `
${term.html()}
<div class="cd" id="${sid}-cd">
  <div class="cd-h">result</div>
  <div class="glow" id="${sid}-glow"></div>
  <div class="big disp"><span id="${sid}-cnt">0/15</span><span id="${sid}-fin" style="opacity:0">15/15</span></div>
  <div class="big-l">tests passing</div>
  <div class="stt" id="${sid}-s0" style="top:470px"><span>failed</span><b>${sumry.fail}</b></div>
  <div class="stt" id="${sid}-s1" style="top:540px"><span>npm test took</span><b class="g">${secs} s</b></div>
  <div class="stt" id="${sid}-s2" style="top:610px"><span>runner</span><b style="font-size:26px">node --test</b></div>
  <div class="stt" id="${sid}-s3" style="top:680px"><span>http tests</span><b style="font-size:26px">supertest</b></div>
</div>`;
  const ops = [...term.ops];
  // counter follows the ticking lines; final value is an exact static swap
  ops.push(`const o11={v:0};tl.to(o11,{v:${tests.length},duration:${f3(t1 - t0)},ease:'none',onUpdate:function(){${el(`${sid}-cnt`)}.textContent=Math.min(${tests.length},Math.round(o11.v))+'/${tests.length}';}},${f3(t0)});`);
  ops.push(st(`${sid}-cnt`, { opacity: 0 }, t1 + 0.05), st(`${sid}-fin`, { opacity: 1 }, t1 + 0.05));
  [0, 1, 2, 3].forEach((i) => ops.push(ft(`${sid}-s${i}`, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, sc.T(i < 2 ? '11b' : '11b', 0.1 + i * 0.16))));
  ops.push(ft(`${sid}-glow`, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, sc.T('11c', 0.05)));
  ops.push(tw(`${sid}-glow`, { opacity: 0.55, duration: 1.4, ease: 'sine.inOut' }, sc.T('11c', 0.05) + 0.6));
  ops.push(`tl.fromTo(${el(`${sid}-fin`)},{scale:1},{scale:1.07,duration:.3,ease:'power2.out',immediateRender:false},${f3(sc.T('11c', 0.05))});tl.to(${el(`${sid}-fin`)},{scale:1,duration:.5,ease:'power2.inOut'},${f3(sc.T('11c', 0.05) + 0.32)});`);
  return build(sc, TL, { css, body, ops });
}

// ================================================================== 12 team
export function s12(sc, TL, D) {
  const sid = sc.id, S = scope(sid);
  const groups = [
    ['Foundation', 'setup, data layer, server', [1, 2, 3]],
    ['Logic', 'validation + controller', [4, 5, 6, 7, 8]],
    ['Assembly', 'routes and app wiring', [9]],
    ['Tests', 'POST, GET, PUT / PATCH / DELETE', [10, 11, 12]],
    ['Docs', 'README, build guide, final check', [13]],
  ];
  const RY = 140, RH = 104, RG = 14, CX = 1210; // chips start x offset inside row: 400
  const css = `
${S} .n13{position:absolute;left:80px;top:150px;font-size:350px;line-height:350px;color:var(--gold);letter-spacing:-0.04em}
${S} .n13l{position:absolute;left:88px;top:600px;font-size:56px;line-height:64px;color:var(--paper)}
${S} .n13s{position:absolute;left:92px;top:750px;font-size:26px;line-height:38px;color:var(--dim);width:640px}
${S} .gr{position:absolute;left:800px;width:1040px;height:${RH}px;border-radius:14px;background:var(--panel);border:2px solid var(--hair)}
${S} .gr-lit{position:absolute;inset:-2px;border-radius:14px;border:3px solid var(--gold);background:rgba(245,184,65,.10);opacity:0}
${S} .gr-n{position:absolute;left:28px;top:16px;font-size:34px;color:var(--paper)}
${S} .gr-d{position:absolute;left:28px;top:62px;font-size:20px;color:var(--dim);white-space:nowrap}
${S} .chp{position:absolute;top:20px;width:64px;height:64px;border-radius:12px;background:var(--gold);color:#0A2A21;font-size:28px;line-height:64px;text-align:center}
${S} .mg{position:absolute;left:800px;top:${RY + 5 * (RH + RG) + 8}px;width:1040px;height:120px}
${S} .mg-l{position:absolute;left:0;top:0;font-size:20px;letter-spacing:.14em;color:var(--dim);text-transform:uppercase}
${S} .mg-line{position:absolute;left:32px;right:32px;top:66px;height:4px;background:var(--hair);border-radius:2px}
${S} .mg-fill{position:absolute;left:32px;width:976px;top:66px;height:4px;background:var(--gold);border-radius:2px;transform-origin:0 50%}
${S} .mg-d{position:absolute;top:56px;width:24px;height:24px;margin-left:-12px;border-radius:50%;background:var(--panel);border:3px solid var(--hair)}
${S} .mg-n{position:absolute;top:88px;width:40px;margin-left:-20px;text-align:center;font-size:18px;color:var(--dim)}
${S} .mg-dl{position:absolute;inset:-3px;border-radius:50%;background:var(--gold);opacity:0}
${S} .url{position:absolute;left:800px;top:${RY + 5 * (RH + RG) + 134}px;font-size:24px;color:var(--dim);white-space:nowrap}
${S} .url b{color:var(--gold);font-weight:700}
`;
  let n = 0;
  const rowsHtml = groups.map((g, i) => {
    const chips = g[2].map((num, j) => `<div class="chp disp" id="${sid}-c${num}" style="left:${430 + j * 78}px">${num}</div>`).join('');
    return `<div class="gr" id="${sid}-g${i}" style="top:${RY + i * (RH + RG)}px"><div class="gr-lit" id="${sid}-gl${i}"></div><div class="gr-n disp">${g[0]}</div><div class="gr-d">${g[1]}</div>${chips}</div>`;
  }).join('');
  const dots = Array.from({ length: 13 }, (_, i) => `<div class="mg-d" id="${sid}-d${i}" style="left:${32 + Math.round((976 / 12) * i)}px"><div class="mg-dl" id="${sid}-dl${i}"></div></div><div class="mg-n" style="left:${32 + Math.round((976 / 12) * i)}px">${i + 1}</div>`).join('');
  const body = `
<div class="n13 disp" id="${sid}-n13">13</div>
<div class="n13l disp" id="${sid}-n13l">members<br>one repo</div>
<div class="n13s" id="${sid}-n13s">Each part is one person's work, roughly 40 to 65 lines of code.</div>
${rowsHtml}
<div class="mg" id="${sid}-mg"><div class="mg-l">merged in order, 1 to 13</div><div class="mg-line"></div><div class="mg-fill" id="${sid}-mgf"></div>${dots}</div>
<div class="url" id="${sid}-url"><b>github.com</b>/Gabby-Css/Expense-Tracker-API---Group-3A</div>`;
  const ops = [];
  ops.push(ft(`${sid}-n13`, { opacity: 0, scale: 0.85, transformOrigin: '0 50%' }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, sc.T('12a', 0.04)));
  ops.push(ft(`${sid}-n13l`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, sc.T('12a', 0.3)));
  groups.forEach((_, i) => ops.push(ft(`${sid}-g${i}`, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, sc.T('12a', 0.25 + i * 0.1))));
  for (let num = 1; num <= 13; num++) ops.push(ft(`${sid}-c${num}`, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, sc.T('12a', 0.4 + num * 0.045)));
  ops.push(ft(`${sid}-n13s`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, sc.T('12b', 0.02)));
  // 12b: rows light up in the order they are named
  const lit = [[0, 0.16], [1, 0.42], [2, 0.66], [3, 0.8], [4, 0.92]];
  lit.forEach(([i, f], k) => {
    ops.push(ft(`${sid}-gl${i}`, { opacity: 0 }, { opacity: 1, duration: 0.3 }, sc.T('12b', f)));
    if (k < lit.length - 1) ops.push(tw(`${sid}-gl${i}`, { opacity: 0, duration: 0.3 }, sc.T('12b', lit[k + 1][1])));
  });
  ops.push(tw(`${sid}-gl4`, { opacity: 0, duration: 0.4 }, sc.T('12c', 0.05)));
  // 12c: merge chain fills 1 -> 13
  ops.push(ft(`${sid}-mg`, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, sc.T('12c', 0.04)));
  const m0 = sc.T('12c', 0.2), m1 = sc.T('12c', 0.9);
  ops.push(ft(`${sid}-mgf`, { scaleX: 0 }, { scaleX: 1, duration: m1 - m0, ease: 'none' }, m0));
  for (let i = 0; i < 13; i++) ops.push(ft(`${sid}-dl${i}`, { opacity: 0 }, { opacity: 1, duration: 0.2 }, m0 + ((m1 - m0) * i) / 12));
  ops.push(ft(`${sid}-url`, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, sc.T('12c', 0.55)));
  return build(sc, TL, { css, body, ops });
}

// ================================================================== 13 close
export function s13(sc, TL, D) {
  const sid = sc.id, S = scope(sid);
  const bullets = ['Full CRUD on expenses', 'Filter, search, sort and paging', 'Summary by category', 'Clear validation errors', '15 of 15 tests passing'];
  const css = maskCss(S) + `
${S} .ttl{position:absolute;left:80px;top:130px;width:960px;font-size:140px;color:var(--paper)}
${S} .ttl b{font-weight:400;color:var(--gold)}
${S} .bl{position:absolute;left:80px;width:940px;height:50px;line-height:50px;font-size:31px;color:var(--paper);display:flex;align-items:center;gap:16px}
${S} .bl .ck{color:var(--mint);flex:0 0 auto}
${S} .box{position:absolute;left:1080px;top:130px;width:760px;height:770px;border-radius:16px;background:var(--panel);border:2px solid var(--hair)}
${S} .box-l{position:absolute;left:44px;top:40px;font-size:20px;letter-spacing:.16em;color:var(--dim);text-transform:uppercase}
${S} .box-u{position:absolute;left:44px;top:84px;font-size:32px;line-height:46px;color:var(--paper)}
${S} .box-u b{color:var(--gold)}
${S} .thx{position:absolute;left:44px;top:330px;font-size:112px;line-height:118px;color:var(--gold)}
${S} .q{position:absolute;left:44px;top:600px;font-size:48px;color:var(--paper);white-space:nowrap}
${S} .q i{display:inline-block;width:22px;height:46px;margin-left:10px;vertical-align:-6px;background:var(--gold);opacity:0}
${S} .g3{position:absolute;left:44px;bottom:36px;font-size:24px;letter-spacing:.2em;color:var(--dim);text-transform:uppercase}
`;
  const T3 = ['EXPENSE', 'TRACKER', '<b>API</b>'];
  const body = `
<div class="ttl disp">${T3.map((t, i) => `<div class="mk"><span id="${sid}-t${i}">${t}</span></div>`).join('')}</div>
${bullets.map((b, i) => `<div class="bl" id="${sid}-b${i}" style="top:${650 + i * 56}px">${CHECK}<span>${b}</span></div>`).join('')}
<div class="box" id="${sid}-box">
  <div class="box-l">source code</div>
  <div class="box-u"><b>github.com</b>/Gabby-Css/<br>Expense-Tracker-API---Group-3A</div>
  <div class="thx disp" id="${sid}-thx">THANK<br>YOU</div>
  <div class="q" id="${sid}-q">Questions?<i id="${sid}-caret"></i></div>
  <div class="g3">Group 3A</div>
</div>`;
  const ops = [];
  T3.forEach((_, i) => ops.push(maskIn(`${sid}-t${i}`, sc.T('13a', 0.0 + i * 0.1), 0.6)));
  [0.28, 0.42, 0.56, 0.7, 0.84].forEach((f, i) => ops.push(ft(`${sid}-b${i}`, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, sc.T('13a', f))));
  ops.push(ft(`${sid}-box`, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }, sc.T('13b', 0.02)));
  ops.push(ft(`${sid}-thx`, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, sc.T('13b', 0.2)));
  const tq = sc.T('13b', 0.55);
  ops.push(ft(`${sid}-q`, { opacity: 0 }, { opacity: 1, duration: 0.4 }, tq));
  const end = sc.dur - 0.5;
  for (let k = 0, t = tq + 0.3; t < end; k++, t += 0.5) ops.push(st(`${sid}-caret`, { opacity: k % 2 === 0 ? 1 : 0 }, t));
  return build(sc, TL, { css, body, ops });
}
