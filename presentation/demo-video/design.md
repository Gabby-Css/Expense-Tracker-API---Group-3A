---
name: Ledger Terminal
description: Emerald ink, gold money accent, warm paper text. A bookkeeper's ruled ledger beside a live terminal.
colors:
  bg: "#0A2A21"
  panel: "#0F3B2E"
  panel-raised: "#134838"
  hairline: "#22604B"
  paper: "#F2EFE4"
  paper-dim: "#A9C2B5"
  gold: "#F5B841"
  mint: "#4AE3A0"
  coral: "#FF7A6B"
typography:
  display:
    fontFamily: "Archivo Black"
    fontWeight: 400
  mono:
    fontFamily: "IBM Plex Mono"
    fontWeights: [400, 700]
spacing:
  margin: 80px
  gap: 40px
---

# Ledger Terminal

## Overview

The video is about an expense tracker, so its visual language is a bookkeeper's ledger: ruled lines on
dark green paper, gold for money and the one accent, warm paper-white text. The live terminal is where
the API is exercised; the ledger panel beside it shows the data file changing after every call.

## Composition Rules

- One accent hue (gold). Mint and coral appear only as status colors: 2xx success and 4xx error.
- Archivo Black for big statements (register: heavy, printed, declarative). IBM Plex Mono for everything
  else (register: precise, machine-readable). Weight contrast is extreme by design.
- Text never sits under 24px. Terminal text is 24px, ledger text 22px, labels 20px uppercase tracked.
- Decoratives (ruled lines, ghost numerals, glow) carry slow ambient motion.
- Scenes share one persistent background in index.html; scene files are transparent.

## Do's and Don'ts

- Do show real responses, real status codes, real timings.
- Do keep the ledger panel and the terminal in the same positions across CRUD scenes.
- Don't use gradient text, left-edge accent stripes, or pure black/white.
- Don't add a fourth accent color.
