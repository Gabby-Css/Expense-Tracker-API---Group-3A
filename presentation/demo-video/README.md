# Expense Tracker API: narrated demo video

A 3 minute 37 second, 1920x1080 narrated demo of the Group 3A Expense Tracker API, built with
[HyperFrames](https://hyperframes.heygen.com) (video authored as HTML and rendered to MP4).

Everything you see on screen comes from the **real running API**: `scripts/capture-session.mjs` starts
the server on a temporary data file, sends the demo requests, and saves every request, response,
status code, timing, server log line and the 15 test results to `assets/session.json`.
The voice is the local Kokoro voice `af_heart` (offline, no account needed).

## What the video shows

| # | Scene | What happens |
| --- | --- | --- |
| 01 | Hook | "Where did your money go this month?" then the title |
| 02 | What it is | One expense record, saved as JSON, and the four CRUD verbs |
| 03 | How it works | A request travelling routes, validation, controller, data file |
| 04 | Run it | `npm install`, `npm run seed`, `npm start` |
| 05 | Create | Health check, then POST (201 Created); a new row appears in the ledger |
| 06 | Read | List, one by id, filter + sort, search, categories |
| 07 | Update | PATCH the amount, PUT a full replacement; `updatedAt` changes, `createdAt` stays |
| 08 | Delete | DELETE, the row leaves the ledger, then GET returns 404 |
| 09 | Summary | Total, count, average and a bar per category |
| 10 | Bad input | Four validation errors at once; broken JSON; unknown route |
| 11 | Tests | 15 of 15 tests passing |
| 12 | The team | 13 members, 13 parts, merged in order |
| 13 | Wrap-up | Recap and the GitHub link |

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The main composition: background, 13 scene slots, 40 voice clips (generated) |
| `compositions/s01-hook.html` ... `s13-close.html` | One file per scene (generated) |
| `script.json` | **The narration.** Spoken text ("say") and on-screen caption ("show") for every line |
| `SCRIPT.md`, `STORYBOARD.md` | Readable copies of the script and the scene plan (generated) |
| `BRIEF.md`, `design.md` | Why the video exists and its look (emerald ink, gold accent, ledger paper) |
| `assets/session.json` | The captured real API session |
| `assets/voice/*.wav` | The 40 voice clips and `audio_meta.json` with exact durations |
| `scripts/` | The generators: `capture-session.mjs`, `voice.py`, `make-voice.mjs`, `build.mjs`, `lib.mjs`, `scenes-*.mjs` |

Scene lengths follow the real voice lengths, so the scene files are **generated**. Edit the scripts, not the HTML.

## Common tasks

Run everything from this folder (`presentation/demo-video`).

```bash
# Change the words: edit script.json, then re-voice only what changed and rebuild
del assets\voice\05b.wav          # (delete the clips you edited; PowerShell: Remove-Item)
node scripts/make-voice.mjs       # voices missing clips, measures durations
node scripts/build.mjs            # regenerates index.html and every scene

# The API changed? Capture a fresh real session (from the repo root), then rebuild
node presentation/demo-video/scripts/capture-session.mjs
node scripts/build.mjs

# Check, preview, render
npm run check                     # lint + layout + contrast audit
npm run dev                       # live preview in the browser (HyperFrames Studio)
npm run render                    # writes an MP4 into renders/ (see the next section for the exact command)
```

### Rendering on a small machine

Rendering captures every frame in a headless browser, so it is CPU and memory hungry.
On a laptop with about 8 GB of RAM: close the browser, VS Code windows and other heavy apps first, then
`npx hyperframes render --workers 1 --fps 24 --output renders/expense-tracker-demo.mp4`.

The delivered file was rendered this way on an Intel Core i3 laptop with 8 GB of RAM:
`expense-tracker-demo.mp4`, H.264 + AAC, 1920x1080, 24 fps, 3 minute 37.5 second, 33 MB, in about 13 minutes.
It is safe to leave running, and `renders/` is git-ignored, so share the MP4 as a file or link rather than
committing it.

If the log shows `Protocol error (Page.captureScreenshot): Target closed`, Chrome ran out of memory. The renderer
retries by itself with a fresh browser, but it starts the capture over, so free some RAM first (close Chrome tabs)
to avoid the restart. With enough free memory the capture ran at about 4 to 9 frames per second.

## Requirements

Node.js 20+, FFmpeg, Python 3 with `kokoro-onnx` and `soundfile` (only for re-voicing), and an internet
connection the first time (Kokoro model download, Google Fonts, GSAP).
