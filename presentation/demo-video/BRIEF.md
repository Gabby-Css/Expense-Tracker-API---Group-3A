---
workflow: general-video
flow: automation
storyboard: no
message: "Group 3A's Expense Tracker API does full CRUD, filtering, summaries and validation, and the tests prove it works."
destination: class-demo-submission
aspect: 1920x1080
language: en
audience: "the lecturer and judges, plus classmates, at the Week 4 live class and in the assignment submission"
length: 3:30-4:15
angle: "a bookkeeper's ledger meets a live terminal: every API call is a line item you watch get written"
---

## Intent

The assignment asks for a 3 to 5 minute video demo of the group's API. Judges score time management,
endpoint testing, CRUD, collaboration, presentation delivery and Q&A. The video therefore walks
Create, Read, Update, Delete in order, shows validation errors and the automated tests, and names the
13-person team. Tone: clear, confident, plain-spoken. Every request, response, status code, timing and
test result on screen is captured from the real running server (`assets/session.json`), never invented.

## Assets

- assets/session.json: the real captured API session (11 requests, server log lines, 15 test results).
  Regenerate with `node scripts/capture-session.mjs` from the repo root.
- ../Expense-Tracker-API-Group3A.pptx: the companion slide deck; same palette (emerald, gold, paper).

## Customizations

- Voice-only audio identity (local Kokoro voice). Music was not available offline; silence under the voice is deliberate.
- Bottom-line captions mirror the narration so the demo works muted.

## Notes

- Autonomous run: the user said "do it for me right now, the best one", so no interview questions were asked.
- The signed-out HeyGen status was relayed; local Kokoro TTS was used as the offline provider.
