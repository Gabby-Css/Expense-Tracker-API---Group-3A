// build.mjs — generates the whole HyperFrames project from script.json + assets/session.json
// + assets/voice/audio_meta.json. Scene durations follow the real voice lengths, so re-run this
// after changing the script or re-voicing:
//
//   node scripts/build.mjs          (run from presentation/demo-video)
//
// Output: index.html, compositions/<scene>.html, SCRIPT.md, STORYBOARD.md

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeTimeline, f3 } from './lib.mjs';
import * as T from './scenes-term.mjs';
import * as O from './scenes-other.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const script = read('script.json');
const session = read('assets/session.json');
let meta = null;
try { meta = read('assets/voice/audio_meta.json'); } catch { console.warn('! no audio_meta.json: using estimated durations'); }
const TL = makeTimeline(script, meta);

// -- shared data for scenes ----------------------------------------------------------------
const step = (k) => {
  const s = session.steps.find((x) => x.key === k);
  if (!s) throw new Error(`no captured step ${k}`);
  return s;
};
const seed = step('health').ledger;
const created = step('create').response.data;
const rows = seed.map((r, i) => ({ key: r.id.slice(0, 8), cat: r.category, idx: i, variants: [{ title: r.title, amount: r.amount }] }));
rows.push({
  key: created.id.slice(0, 8), cat: created.category, idx: rows.length, cur: 0,
  variants: [
    { title: created.title, amount: created.amount },
    { title: step('patch').response.data.title, amount: step('patch').response.data.amount },
    { title: step('put').response.data.title, amount: step('put').response.data.amount },
  ],
});
const D = { session, step, rows, createdKey: created.id.slice(0, 8), seedRows: seed, script };

const builders = {
  's01-hook': O.s01, 's02-what': O.s02, 's03-flow': O.s03, 's04-run': T.s04, 's05-create': T.s05,
  's06-read': T.s06, 's07-update': T.s07, 's08-delete': T.s08, 's09-summary': O.s09, 's10-invalid': O.s10,
  's11-tests': O.s11, 's12-team': O.s12, 's13-close': O.s13,
};

// -- scene files ------------------------------------------------------------------------------
fs.mkdirSync(path.join(root, 'compositions'), { recursive: true });
const built = [];
for (const sc of TL.scenes) {
  const b = builders[sc.id];
  if (!b || (process.env.ONLY && !process.env.ONLY.split(',').includes(sc.id))) continue;
  fs.writeFileSync(path.join(root, 'compositions', `${sc.id}.html`), b(sc, TL, D));
  built.push(sc);
  console.log(`scene ${sc.id.padEnd(12)} start ${sc.start.toFixed(2).padStart(7)}  dur ${sc.dur.toFixed(2).padStart(6)}`);
}

// -- index.html ---------------------------------------------------------------------------------
const total = Math.ceil(TL.total * 100) / 100;
const hosts = built.map((sc) =>
  `      <div id="el-${sc.id}" data-composition-id="${sc.id}" data-composition-src="compositions/${sc.id}.html" data-start="${f3(sc.start)}" data-duration="${f3(sc.dur)}" data-track-index="${1 + (sc.idx % 2)}" data-width="1920" data-height="1080"></div>`).join('\n');
const audio = TL.scenes.flatMap((sc) => (built.includes(sc) ? sc.beats : []))
  .filter((b) => fs.existsSync(path.join(root, 'assets', 'voice', `${b.id}.wav`)))
  .map((b) => `      <audio id="vo-${b.id}" src="assets/voice/${b.id}.wav" data-start="${f3(b.gs)}" data-duration="${(Math.floor(b.ld * 1000) / 1000).toFixed(3)}" data-track-index="10" data-volume="1"></audio>`).join('\n');

fs.writeFileSync(path.join(root, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Expense Tracker API - Group 3A demo</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #0A2A21; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #0A2A21; }
      /* persistent bookkeeper's-ledger background: ruled lines + a warm glow, both drifting slowly */
      #bg-rules { position: absolute; left: 0; top: 0; width: 1920px; height: 1350px;
        background: repeating-linear-gradient(to bottom, transparent 0, transparent 53px, rgba(169,194,181,0.10) 53px, rgba(169,194,181,0.10) 54px); }
      #bg-glow { position: absolute; left: -300px; top: -400px; width: 1500px; height: 1500px; border-radius: 50%;
        background: radial-gradient(circle at 50% 50%, rgba(245,184,65,0.20) 0%, rgba(245,184,65,0.07) 38%, rgba(245,184,65,0) 66%); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="1920" data-height="1080" data-duration="${f3(total)}">
      <div id="bg-rules"></div>
      <div id="bg-glow"></div>
${hosts}
${audio}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      // ambient motion: the ruled lines drift up exactly four line-periods (seamless), the glow drifts across
      tl.fromTo("#bg-rules", { y: 0 }, { y: -216, duration: ${f3(total)}, ease: "none" }, 0);
      tl.fromTo("#bg-glow", { x: 0, y: 0 }, { x: 620, y: 240, duration: ${f3(total)}, ease: "sine.inOut" }, 0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`);

// -- SCRIPT.md + STORYBOARD.md ----------------------------------------------------------------------
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
fs.writeFileSync(path.join(root, 'SCRIPT.md'), `# SCRIPT - expense-tracker-demo

**Voice:** Kokoro af_heart (local, offline), speed ${script.speed}
**Voice direction:** Clear, calm, plain-spoken; a student explaining their own project.

Generated from script.json. Edit the "say" text there (spoken form: "A P I", "J S O N", "N P M") and the
"show" text (the on-screen caption), then run \`node scripts/make-voice.mjs\` and \`node scripts/build.mjs\`.

${TL.scenes.map((sc) => `## ${String(sc.idx + 1).padStart(2, '0')} - ${sc.chapter}\n\n${sc.beats.map((b) => `**${b.id}** (${b.ld.toFixed(1)}s)\n\n    ${b.say}\n`).join('\n')}`).join('\n')}`);

fs.writeFileSync(path.join(root, 'STORYBOARD.md'), `---
format: 1920x1080
duration: ${mmss(TL.total)}
message: "Group 3A's Expense Tracker API does full CRUD, filtering, summaries and validation, and the tests prove it works."
arc: Hook > What it is > How it works > Run > Create > Read > Update > Delete > Summary > Bad input > Tests > Team > Wrap-up
audience: the lecturer, judges and classmates
mode: autonomous
---

${TL.scenes.map((sc) => `## Frame ${sc.idx + 1} - ${sc.chapter}

- scene: ${sc.chapter}
- duration: ${sc.dur.toFixed(1)}s
- transition_in: crossfade
- status: ${built.includes(sc) ? 'animated' : 'outline'}
- voiceover: "${sc.beats.map((b) => b.show).join(' ')}"
- src: compositions/${sc.id}.html
`).join('\n')}`);

console.log(`\nindex.html  ${built.length}/${TL.count} scenes, ${audio ? audio.split('\n').length : 0} voice clips, total ${mmss(TL.total)} (${TL.total.toFixed(1)}s)`);
