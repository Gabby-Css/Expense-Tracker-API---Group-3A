// lib.mjs — shared helpers for the generator (timing model, HTML shell, terminal, ledger).
//
// Design rule for everything animated here: use plain property tweens (opacity, x/y, clip-path,
// scale) and never DOM-mutating callbacks. The HyperFrames runtime seeks the GSAP timeline with a
// two-step totalTime() call whose first jump suppresses events, so anything driven by onUpdate/call
// could render stale. Property tweens are correct at any seek position.

export const C = {
  bg: '#0A2A21', panel: '#0F3B2E', raised: '#134838', hair: '#22604B', paper: '#F2EFE4',
  dim: '#A9C2B5', punct: '#93B3A3', gold: '#F5B841', mint: '#4AE3A0', coral: '#FF7A6B',
};
export const CAT = {
  Food: '#F5B841', Transport: '#7FB8D9', Housing: '#B79BE0', Utilities: '#E8985E', Health: '#F27D8E',
  Education: '#4AE3A0', Entertainment: '#E36FBB', Shopping: '#C9D46A', Other: '#9AA9A2',
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const money = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const f3 = (n) => (Math.round(n * 1000) / 1000).toFixed(3);
export const CHECK = '<svg class="ck" viewBox="0 0 24 24" width="24" height="24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const el = (id) => `document.getElementById(${JSON.stringify(id)})`;

// ---------------------------------------------------------------- timing model
const estimate = (text) => text.split(/\s+/).length / 3.2 + 0.4;

export function makeTimeline(script, meta, opt = {}) {
  const gap = opt.gap ?? 0.45, pre = opt.pre ?? 0.7, post = opt.post ?? 0.8, overlap = opt.overlap ?? 0.4;
  let cursor = 0;
  const scenes = [];
  script.scenes.forEach((sc, i) => {
    let local = pre;
    const beats = sc.beats.map((b, j) => {
      const d = meta?.beats?.[b.id]?.duration ?? estimate(b.say);
      const out = { ...b, ls: local, ld: d };
      local += d + (j < sc.beats.length - 1 ? gap : 0);
      return out;
    });
    const dur = local + (i === script.scenes.length - 1 ? (opt.lastPost ?? 2.2) : post);
    const start = i === 0 ? 0 : cursor - overlap;
    const scene = {
      ...sc, idx: i, start, dur, beats: beats.map((b) => ({ ...b, gs: start + b.ls })),
      // local time inside the scene: beat start + fraction of its spoken length + offset
      T(id, frac = 0, off = 0) {
        const b = beats.find((x) => x.id === id);
        if (!b) throw new Error(`no beat ${id} in ${sc.id}`);
        return b.ls + frac * b.ld + off;
      },
      D(id) { return beats.find((x) => x.id === id).ld; },
    };
    scenes.push(scene);
    cursor = start + dur;
  });
  return { scenes, total: cursor, count: scenes.length };
}

// ---------------------------------------------------------------- scene shell
export function commonCss(S) {
  return `
${S}{position:absolute;inset:0;overflow:hidden;font-family:"IBM Plex Mono",ui-monospace,monospace;color:#F2EFE4;font-variant-ligatures:none;
  --bg:#0A2A21;--panel:#0F3B2E;--raised:#134838;--hair:#22604B;--paper:#F2EFE4;--dim:#A9C2B5;--punct:#93B3A3;--gold:#F5B841;--mint:#4AE3A0;--coral:#FF7A6B}
${S} *{box-sizing:border-box;margin:0;padding:0}
${S} .wrap{position:absolute;inset:0}
${S} .disp{font-family:"Archivo Black","IBM Plex Mono",sans-serif;font-weight:400;letter-spacing:-0.02em;text-transform:uppercase}
${S} .hdr{position:absolute;left:80px;right:80px;top:40px;height:44px;display:flex;align-items:center;justify-content:space-between}
${S} .chap{display:flex;gap:18px;align-items:baseline;font-size:22px;letter-spacing:.16em;text-transform:uppercase}
${S} .chap-n{color:var(--gold);font-weight:700}
${S} .chap-t{color:var(--dim)}
${S} .ticks{display:flex;gap:8px}
${S} .tk{display:block;width:16px;height:8px;border-radius:2px;background:rgba(169,194,181,.24)}
${S} .tk.past{background:rgba(169,194,181,.6)}
${S} .tk.on{background:var(--gold)}
${S} .caps{position:absolute;left:80px;right:80px;bottom:40px;height:88px}
${S} .cap{position:absolute;left:0;right:0;top:0;font-size:28px;line-height:40px;color:var(--paper);opacity:0}
${S} .dim{color:var(--dim)}
${S} .gold{color:var(--gold)}
${S} .mint{color:var(--mint)}
${S} .coral{color:var(--coral)}
`;
}

export function chrome(sid, scene, total) {
  const n = String(scene.idx + 1).padStart(2, '0');
  const ticks = Array.from({ length: total }, (_, i) => `<i class="tk ${i < scene.idx ? 'past' : i === scene.idx ? 'on' : ''}"></i>`).join('');
  const caps = scene.beats.map((b, i) => `<div class="cap" id="${sid}-cap${i}">${esc(b.show)}</div>`).join('');
  const html = `<div class="hdr"><div class="chap"><span class="chap-n">${n}</span><span class="chap-t">${esc(scene.chapter)}</span></div><div class="ticks">${ticks}</div></div>
<div class="caps">${caps}</div>`;
  const ops = [];
  scene.beats.forEach((b, i) => {
    ops.push(`tl.fromTo(${el(`${sid}-cap${i}`)},{opacity:0,y:8},{opacity:1,y:0,duration:.22,ease:'power2.out'},${f3(b.ls - 0.02)});`);
    ops.push(`tl.to(${el(`${sid}-cap${i}`)},{opacity:0,duration:.18,ease:'power1.in'},${f3(b.ls + b.ld + 0.04)});`);
  });
  return { html, ops };
}

const chunk = (a, n) => { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n).join(' ')); return r; };
export function shell({ sid, dur, css, body, ops }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${sid}</title>
  </head>
  <body>
    <template id="${sid}-template">
      <style>${css}</style>
      <div data-composition-id="${sid}" data-width="1920" data-height="1080" data-duration="${f3(dur)}">
        <div class="wrap" id="${sid}-wrap">
${body}
        </div>
        <script>
          (function () {
            const SID = ${JSON.stringify(sid)};
            const tl = gsap.timeline({ paused: true });
            tl.fromTo(${el(`${sid}-wrap`)}, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0);
            tl.to(${el(`${sid}-wrap`)}, { opacity: 0, duration: 0.4, ease: "power2.in" }, ${f3(dur - 0.42)});
${chunk(ops, 5).map((o) => '            ' + o).join('\n')}
            window.__timelines[SID] = tl;
          })();
        </script>
      </div>
    </template>
  </body>
</html>
`;
}

// ---------------------------------------------------------------- JSON renderer (syntax coloured, elided)
export function renderJson(value, o = {}) {
  const { sid = 'x', marks = {}, notes = {}, compact = null, indent = 2, inlineFrom = null } = o;
  const lines = [];
  const pad = (n) => ' '.repeat(n);
  const P = (t) => `<span class="p">${t}</span>`;
  const scal = (v) =>
    typeof v === 'string' ? `<span class="s">${esc(JSON.stringify(v))}</span>`
    : typeof v === 'number' ? `<span class="n">${v}</span>`
    : v === true ? '<span class="t">true</span>'
    : v === false ? '<span class="f">false</span>'
    : P('null');
  const mark = (path, html) => (marks[path] ? `<span class="mk" id="${sid}-mk-${marks[path]}">${html}</span>` : html);
  const note = (path) => (notes[path] ? `<span class="note" id="${sid}-nt-${notes[path].id}">  ${esc(notes[path].text)}</span>` : '');
  const key = (k) => `<span class="k">${esc(JSON.stringify(k))}</span>`;
  const compactObj = (it) =>
    P('{ ') + compact.map((k) => `${key(k)}${P(': ')}${scal(it[k])}${P(', ')}`).join('') + P('… }');

  function walk(v, depth, path, k, comma) {
    const pre = pad(depth * indent) + (k !== null ? key(k) + P(': ') : '');
    const c = comma ? P(',') : '';
    if (Array.isArray(v)) {
      if (!v.length) return void lines.push(pre + P('[]') + c);
      lines.push(pre + P('['));
      v.forEach((it, i) => {
        const last = i === v.length - 1;
        if (compact && it && typeof it === 'object') lines.push(pad((depth + 1) * indent) + compactObj(it) + (last ? '' : P(',')));
        else walk(it, depth + 1, `${path}.${i}`, null, !last);
      });
      lines.push(pad(depth * indent) + P(']') + c);
    } else if (v && typeof v === 'object' && inlineFrom !== null && depth >= inlineFrom && Object.values(v).every((x) => typeof x !== 'object')) {
      lines.push(pre + P('{ ') + Object.keys(v).map((kk) => `${key(kk)}${P(': ')}${scal(v[kk])}`).join(P(', ')) + P(' }') + c);
    } else if (v && typeof v === 'object') {
      lines.push(pre + P('{'));
      const ks = Object.keys(v);
      ks.forEach((kk, i) => walk(v[kk], depth + 1, path ? `${path}.${kk}` : kk, kk, i < ks.length - 1));
      lines.push(pad(depth * indent) + P('}') + c);
    } else {
      lines.push(pre + mark(path, scal(v)) + c + note(path));
    }
  }
  walk(value, 0, '', null, false);
  return lines;
}

const visibleLen = (html) =>
  html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').length;

// ---------------------------------------------------------------- terminal
export class Term {
  constructor(sid, { x, y, w, h, title, chip = '', id = 'term', lh = 36, fs = 24, cw = fs * 0.6, style = '' }) {
    Object.assign(this, { sid, x, y, w, h, title, chip, id, lh, cw, fs });
    this.vis = Math.floor((h - 72 - 20) / lh); // visible lines
    this.maxChars = Math.floor((w - 60) / cw);
    this.pages = [];
    this.cur = null;
    this.ops = [];
    this.style = style;
    this.chips = [];
  }
  _id(s) { return `${this.sid}-${this.id}-${s}`; }
  page(at) {
    if (this.cur) this.ops.push(`tl.to(${el(this.cur.pid)},{opacity:0,duration:.25,ease:'power1.in'},${f3(at - 0.3)});`);
    const i = this.pages.length;
    this.cur = { i, pid: this._id(`pg${i}`), n: 0, html: [], scroll: 0 };
    this.pages.push(this.cur);
    this.ops.push(`tl.set(${el(this.cur.pid)},{y:0},0);`);
    this.ops.push(`tl.fromTo(${el(this.cur.pid)},{opacity:0},{opacity:1,duration:.25,ease:'power1.out'},${f3(at)});`);
    return this;
  }
  blank() { this.cur.n++; return this; }
  _scroll(fromIdx, toIdx, tStart, tEnd) {
    const P = this.cur;
    const need = Math.max(0, (toIdx + 1) * this.lh - this.vis * this.lh);
    if (need > P.scroll) {
      this.ops.push(`tl.fromTo(${el(P.pid)},{y:${-P.scroll}},{y:${-need},duration:${f3(Math.max(0.3, tEnd - tStart + 0.25))},ease:'power2.out',immediateRender:false},${f3(tStart)});`);
      P.scroll = need;
    }
  }
  // Type a command line (prompt static, text revealed char by char). Returns end time.
  type(text, at, dur, { prefix = '$ ', hold = 0.7 } = {}) {
    const P = this.cur, idx = P.n++;
    const id = this._id(`pg${P.i}-l${idx}`);
    const n = text.length;
    const px = prefix.length * this.cw;
    if (prefix.length + n > this.maxChars) console.warn(`  ! line too long (${prefix.length + n} > ${this.maxChars}): ${text.slice(0, 50)}`);
    P.html.push(`<div class="ln" id="${id}" style="top:${idx * this.lh}px"><span class="ps">${esc(prefix)}</span><span class="cmd" id="${id}-c">${esc(text)}</span><i class="caret" id="${id}-k"></i></div>`);
    const t0 = at + 0.12;
    this.ops.push(`tl.fromTo(${el(id)},{opacity:0},{opacity:1,duration:.01},${f3(at)});`);
    this.ops.push(`tl.fromTo(${el(id + '-c')},{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:${f3(dur)},ease:'steps(${n})'},${f3(t0)});`);
    this.ops.push(`tl.fromTo(${el(id + '-k')},{x:${px},opacity:1},{x:${px + n * this.cw},opacity:1,duration:${f3(dur)},ease:'steps(${n})'},${f3(t0)});`);
    // blink while idle after typing, then vanish (the command "runs")
    const te = t0 + dur;
    for (let k = 0, t = te + 0.02; t < te + hold; k++, t += 0.35) this.ops.push(`tl.set(${el(id + '-k')},{opacity:${k % 2 === 0 ? 0 : 1}},${f3(t)});`);
    this.ops.push(`tl.set(${el(id + '-k')},{opacity:0},${f3(te + hold)});`);
    this._scroll(idx, idx, at, at);
    return te;
  }
  // Print lines (already-styled HTML) top to bottom with a stagger. Returns end time.
  print(lines, at, { stagger = 0.06, dur = 0.22 } = {}) {
    const P = this.cur;
    let firstOverflow = null;
    const ids = [];
    lines.forEach((html, j) => {
      const idx = P.n++;
      const id = this._id(`pg${P.i}-l${idx}`);
      ids.push(id);
      if (visibleLen(html) > this.maxChars) console.warn(`  ! line too long (${visibleLen(html)} > ${this.maxChars}): ${html.replace(/<[^>]+>/g, '').slice(0, 60)}`);
      P.html.push(`<div class="ln" id="${id}" style="top:${idx * this.lh}px">${html}</div>`);
      const t = at + j * stagger;
      this.ops.push(`tl.fromTo(${el(id)},{opacity:0,y:8},{opacity:1,y:0,duration:${f3(dur)},ease:'power2.out'},${f3(t)});`);
      if (firstOverflow === null && (idx + 1) * this.lh > this.vis * this.lh) firstOverflow = { j, idx };
    });
    const lastIdx = P.n - 1;
    if (firstOverflow) this._scroll(firstOverflow.idx, lastIdx, at + firstOverflow.j * stagger, at + (lines.length - 1) * stagger);
    return at + (lines.length - 1) * stagger + dur;
  }
  mark(name, at, color = 'rgba(245,184,65,.30)') {
    const id = `${this.sid}-mk-${name}`;
    this.ops.push(`tl.fromTo(${el(id)},{backgroundColor:'rgba(245,184,65,0)'},{backgroundColor:${JSON.stringify(color)},duration:.3,ease:'power2.out'},${f3(at)});`);
  }
  reveal(id, at, dur = 0.3) {
    this.ops.push(`tl.fromTo(${el(id)},{opacity:0,y:6},{opacity:1,y:0,duration:${f3(dur)},ease:'power2.out'},${f3(at)});`);
  }
  // header chip that swaps text (crossfade between stacked spans)
  chipSwap(texts, times) {
    texts.forEach((t, i) => {
      const id = this._id(`chip${i}`);
      this.chips.push(`<span class="chip-v" id="${id}"${i === 0 ? '' : ' style="opacity:0"'}>${t}</span>`);
      if (i > 0) {
        this.ops.push(`tl.to(${el(this._id(`chip${i - 1}`))},{opacity:0,duration:.2},${f3(times[i - 1])});`);
        this.ops.push(`tl.fromTo(${el(id)},{opacity:0},{opacity:1,duration:.2},${f3(times[i - 1])});`);
      }
    });
  }
  html() {
    const chip = this.chips.length ? `<span class="term-chip">${this.chips.join('')}</span>` : this.chip ? `<span class="term-chip"><span class="chip-v">${this.chip}</span></span>` : '<span></span>';
    return `<div class="term" style="left:${this.x}px;top:${this.y}px;width:${this.w}px;height:${this.h}px">
  <div class="term-bar"><span>${esc(this.title)}</span>${chip}</div>
  <div class="term-body">${this.pages.map((p) => `<div class="pg" id="${p.pid}">${p.html.join('')}</div>`).join('')}</div>
</div>`;
  }
  css(S) {
    return `
${S} .term{position:absolute;border-radius:16px;background:var(--panel);border:2px solid var(--hair);overflow:hidden}
${S} .term-bar{position:absolute;left:0;right:0;top:0;height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:var(--raised);font-size:20px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
${S} .term-chip{position:relative;display:inline-block;min-width:260px;height:28px;text-align:right;color:var(--mint)}
${S} .chip-v{position:absolute;right:0;top:0;white-space:nowrap}
${S} .term-body{position:absolute;left:30px;right:30px;top:72px;bottom:20px;overflow:hidden}
${S} .pg{position:absolute;left:0;top:0;right:0;height:${(this.vis + 8) * this.lh}px;opacity:0}
${S} .ln{position:absolute;left:0;right:0;height:${this.lh}px;line-height:${this.lh}px;font-size:${this.fs}px;white-space:pre;color:var(--paper)}
${S} .ps{color:var(--gold);font-weight:700}
${S} .cmd{display:inline-block;white-space:pre}
${S} .caret{position:absolute;left:0;top:${Math.round((this.lh - this.fs) / 2)}px;width:${Math.round(this.fs * 0.55)}px;height:${this.fs}px;background:var(--gold);opacity:0}
${S} .k{color:var(--dim)} ${S} .s{color:var(--paper)} ${S} .n{color:var(--gold)} ${S} .t{color:var(--mint)} ${S} .f{color:var(--coral)} ${S} .p{color:var(--punct)}
${S} .mk{border-radius:4px;padding:1px 5px;margin:0 -5px}
${S} .note{color:var(--gold);font-weight:700;opacity:0}
${S} .st{font-weight:700}
${S} .st.ok{color:var(--mint)} ${S} .st.bad{color:var(--coral)}
`;
  }
}

// helper: status + server-log lines for a captured step
export function statusLines(step, { showLog = true } = {}) {
  const ok = step.status < 400;
  const m = step.log.match(/(\d+\.\d+) ms/);
  const ms = m ? `${parseFloat(m[1]).toFixed(1)} ms` : `${step.ms} ms`;
  const out = [`<span class="st ${ok ? 'ok' : 'bad'}">${step.status} ${esc(step.statusText || (ok ? 'OK' : ''))}</span><span class="dim">  ·  ${ms}</span>`];
  if (showLog && step.log) {
    const short = step.log.replace(/([0-9a-f]{8})-[0-9a-f-]{27}/g, '$1…');
    out.push(`<span class="dim">log: ${esc(short)}</span>`);
  }
  return out;
}

// ---------------------------------------------------------------- ledger panel
export class Ledger {
  constructor(sid, { x, y, w, h, rowH = 52 }, rows, { totals, counts, hidden = [] }) {
    Object.assign(this, { sid, x, y, w, h, rowH });
    this.rows = rows; // {key, cat, variants:[{title, amount}], idx}
    this.totals = totals; this.counts = counts;
    this.hidden = new Set(hidden); // rows not present at scene start
    this.ti = 0;
    this.ops = [];
    this.order = rows.filter((r) => !this.hidden.has(r.key)).map((r) => r.key);
    this.dy = {};
    rows.forEach((r) => (this.dy[r.key] = 0));
  }
  _row(k) { return `${this.sid}-row-${k}`; }
  _r(k) { return this.rows.find((r) => r.key === k); }
  html() {
    const rows = this.rows.map((r) => {
      const hid = this.hidden.has(r.key);
      return `<div class="row" id="${this._row(r.key)}" style="top:${r.idx * this.rowH}px${hid ? ';opacity:0' : ''}">
  <div class="hl" id="${this._row(r.key)}-hl"></div><div class="stk" id="${this._row(r.key)}-stk"></div><i class="dot" style="background:${CAT[r.cat] || CAT.Other}"></i>
  <div class="rt">${r.variants.map((v, i) => `<span class="v" id="${this._row(r.key)}-t${i}"${i !== (r.cur || 0) ? ' style="opacity:0"' : ''}>${esc(v.title)}</span>`).join('')}</div>
  <div class="ra">${r.variants.map((v, i) => `<span class="v" id="${this._row(r.key)}-a${i}"${i !== (r.cur || 0) ? ' style="opacity:0"' : ''}>${money(v.amount)}</span>`).join('')}</div>
</div>`;
    }).join('');
    const tot = this.totals.map((t, i) => `<span class="v" id="${this.sid}-tot${i}"${i ? ' style="opacity:0"' : ''}>${t}</span>`).join('');
    const cnt = this.counts.map((t, i) => `<span class="v" id="${this.sid}-cnt${i}"${i ? ' style="opacity:0"' : ''}>${t}</span>`).join('');
    return `<div class="led" id="${this.sid}-led" style="left:${this.x}px;top:${this.y}px;width:${this.w}px;height:${this.h}px">
  <div class="led-h"><span>data/express.json</span><span class="led-cnt">${cnt}</span></div>
  <div class="led-rows">${rows}</div>
  <div class="led-f"><span class="led-tl">TOTAL</span><span class="led-tv">${tot}</span></div>
</div>`;
  }
  css(S) {
    return `
${S} .led{position:absolute;border-radius:16px;background:var(--panel);border:2px solid var(--hair);overflow:hidden}
${S} .led-h{position:absolute;left:24px;right:24px;top:0;height:64px;display:flex;align-items:center;justify-content:space-between;font-size:20px;letter-spacing:.1em;color:var(--dim);border-bottom:1px solid var(--hair);text-transform:uppercase}
${S} .led-cnt{position:relative;display:inline-block;width:200px;height:28px;text-align:right;color:var(--paper)}
${S} .led-cnt .v,${S} .led-tv .v{position:absolute;right:0;top:0;white-space:nowrap}
${S} .led-rows{position:absolute;left:0;right:0;top:76px;bottom:88px}
${S} .row{position:absolute;left:0;right:0;height:${this.rowH}px;border-bottom:1px solid rgba(34,96,75,.55)}
${S} .row .dot{position:absolute;left:26px;top:${(this.rowH - 12) / 2}px;width:12px;height:12px;border-radius:50%}
${S} .row .rt{position:absolute;left:54px;right:128px;top:0;height:${this.rowH}px;font-size:21px;line-height:${this.rowH}px}
${S} .row .ra{position:absolute;right:26px;width:104px;top:0;height:${this.rowH}px;font-size:21px;line-height:${this.rowH}px;text-align:right;font-variant-numeric:tabular-nums}
${S} .row .v{position:absolute;left:0;right:0;top:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
${S} .row .ra .v{text-align:right}
${S} .row .hl{position:absolute;left:8px;right:8px;top:3px;bottom:3px;border-radius:8px;opacity:0;background:rgba(245,184,65,.22)}
${S} .row .stk{position:absolute;left:44px;right:26px;top:${this.rowH / 2}px;height:3px;background:var(--coral);transform-origin:0 50%;transform:scaleX(0)}
${S} .led-f{position:absolute;left:24px;right:24px;bottom:0;height:88px;border-top:1px solid var(--hair);display:flex;align-items:center;justify-content:space-between}
${S} .led-tl{font-size:20px;letter-spacing:.14em;color:var(--dim)}
${S} .led-tv{position:relative;display:inline-block;width:280px;height:44px;color:var(--gold);font-size:38px;font-weight:700;line-height:44px;font-variant-numeric:tabular-nums}
`;
  }
  // -- operations -------------------------------------------------------------------------
  cascade(keys, at, stagger = 0.09) {
    keys.forEach((k) => { this.hidden.delete(k); this.order.push(k); });
    keys.forEach((k, i) => this.ops.push(`tl.fromTo(${el(this._row(k))},{opacity:0,x:50},{opacity:1,x:0,duration:.4,ease:'power3.out'},${f3(at + i * stagger)});`));
  }
  flash(k, at, color = 'rgba(74,227,160,.32)') {
    const id = this._row(k) + '-hl';
    this.ops.push(`tl.fromTo(${el(id)},{opacity:0,backgroundColor:${JSON.stringify(color)}},{opacity:1,duration:.22,ease:'power2.out',immediateRender:false},${f3(at)});`);
    this.ops.push(`tl.to(${el(id)},{opacity:0,duration:.9,ease:'power2.inOut'},${f3(at + 0.55)});`);
  }
  add(k, at, color) {
    this.ops.push(`tl.fromTo(${el(this._row(k))},{opacity:0,x:70},{opacity:1,x:0,duration:.5,ease:'power3.out'},${f3(at)});`);
    this.flash(k, at + 0.15, color);
    this.order.push(k);
    this.hidden.delete(k);
  }
  variant(k, v, at, color = 'rgba(245,184,65,.34)') {
    const id = this._row(k), r = this._r(k), prev = r.cur || 0;
    r.cur = v;
    this.ops.push(`tl.to(${el(id + '-t' + prev)},{opacity:0,duration:.25},${f3(at)});tl.fromTo(${el(id + '-t' + v)},{opacity:0},{opacity:1,duration:.25},${f3(at)});`);
    this.ops.push(`tl.to(${el(id + '-a' + prev)},{opacity:0,y:-10,duration:.25},${f3(at)});tl.fromTo(${el(id + '-a' + v)},{opacity:0,y:10},{opacity:1,y:0,duration:.25},${f3(at)});`);
    this.flash(k, at, color);
  }
  remove(k, at) {
    const id = this._row(k);
    this.ops.push(`tl.fromTo(${el(id + '-stk')},{scaleX:0},{scaleX:1,duration:.35,ease:'power2.out'},${f3(at)});`);
    this.ops.push(`tl.to(${el(id)},{opacity:0,x:40,duration:.4,ease:'power2.in'},${f3(at + 0.5)});`);
    const pos = this.order.indexOf(k);
    this.order.splice(pos, 1);
    this.order.slice(pos).forEach((kk) => {
      const from = this.dy[kk], to = from - this.rowH;
      this.ops.push(`tl.fromTo(${el(this._row(kk))},{y:${from}},{y:${to},duration:.4,ease:'power2.inOut'},${f3(at + 0.7)});`);
      this.dy[kk] = to;
    });
  }
  setTotal(i, at) {
    const prev = this.ti;
    if (i === prev) return;
    this.ops.push(`tl.to(${el(`${this.sid}-tot${prev}`)},{opacity:0,y:-14,duration:.25},${f3(at)});tl.fromTo(${el(`${this.sid}-tot${i}`)},{opacity:0,y:14},{opacity:1,y:0,duration:.3,ease:'power2.out'},${f3(at)});`);
    this.ti = i;
  }
  setCount(i, at) {
    const prev = this.ci ?? 0;
    this.ci = i;
    this.ops.push(`tl.to(${el(`${this.sid}-cnt${prev}`)},{opacity:0,duration:.2},${f3(at)});tl.fromTo(${el(`${this.sid}-cnt${i}`)},{opacity:0},{opacity:1,duration:.25},${f3(at)});`);
  }
  focus(keys, at, color = 'rgba(245,184,65,.22)') {
    const set = new Set(keys);
    this.rows.forEach((r) => {
      if (this.hidden.has(r.key)) return;
      const on = set.has(r.key);
      this.ops.push(`tl.to(${el(this._row(r.key))},{opacity:${on ? 1 : 0.28},duration:.3},${f3(at)});`);
      this.ops.push(`tl.to(${el(this._row(r.key) + '-hl')},{opacity:${on ? 1 : 0},duration:.3},${f3(at)});`);
    });
  }
  unfocus(at) {
    this.rows.forEach((r) => {
      if (this.hidden.has(r.key)) return;
      this.ops.push(`tl.to(${el(this._row(r.key))},{opacity:1,duration:.3},${f3(at)});`);
      this.ops.push(`tl.to(${el(this._row(r.key) + '-hl')},{opacity:0,duration:.3},${f3(at)});`);
    });
  }
}
