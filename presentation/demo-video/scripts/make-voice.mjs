// make-voice.mjs — voices every beat in script.json with the local Kokoro engine (scripts/voice.py)
// and records exact durations in assets/voice/audio_meta.json.
// Existing files are kept, so an interrupted run resumes; delete a .wav to re-voice that beat.
//
//   node scripts/make-voice.mjs            (run from presentation/demo-video)

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = JSON.parse(fs.readFileSync(path.join(root, 'script.json'), 'utf8'));
const outDir = path.join(root, 'assets', 'voice');
fs.mkdirSync(outDir, { recursive: true });

const duration = (file) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  return parseFloat(r.stdout);
};

// Voice every missing beat in ONE python process (model loads once), then measure durations.
const py = spawnSync('python', ['scripts/voice.py'], { cwd: root, stdio: 'inherit' });
if (py.status !== 0) { console.error('voice.py failed'); process.exit(1); }

// Loudness-normalise each raw clip to -16 LUFS (two-pass loudnorm, true peak -1.5 dB) so the narration
// plays at a normal level without clipping. Re-done only when the raw clip is newer than the result.
const TARGET = 'I=-16:TP=-1.5:LRA=11';
function normalize(raw, out) {
  const p1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', raw, '-af', `loudnorm=${TARGET}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  const j = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf('{'), p1.stderr.lastIndexOf('}') + 1));
  const af = `loudnorm=${TARGET}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  const p2 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', raw, '-af', af, '-ar', '24000', '-ac', '1', out], { encoding: 'utf8' });
  if (p2.status !== 0) throw new Error(`normalize failed for ${raw}
${p2.stderr.slice(-300)}`);
}

const meta = { voice: script.voice, speed: script.speed, loudness: '-16 LUFS', beats: {} };
for (const scene of script.scenes) {
  for (const beat of scene.beats) {
    const raw = path.join(outDir, 'raw', `${beat.id}.wav`);
    const file = path.join(outDir, `${beat.id}.wav`);
    if (!fs.existsSync(file) || (fs.existsSync(raw) && fs.statSync(file).mtimeMs < fs.statSync(raw).mtimeMs)) normalize(raw, file);
    const d = duration(file);
    meta.beats[beat.id] = { file: `assets/voice/${beat.id}.wav`, duration: Math.round(d * 1000) / 1000 };
    console.log(`${beat.id}  ${d.toFixed(2)}s  ${beat.say.slice(0, 60)}`);
  }
}
fs.writeFileSync(path.join(outDir, 'audio_meta.json'), JSON.stringify(meta, null, 2));
const total = Object.values(meta.beats).reduce((a, b) => a + b.duration, 0);
console.log(`voiced ${Object.keys(meta.beats).length} beats, ${total.toFixed(1)}s of speech`);
