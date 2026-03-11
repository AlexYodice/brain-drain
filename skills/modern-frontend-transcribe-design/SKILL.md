---
name: modern-frontend-transcribe-design
description: Build modern, intentional front-end UX for transcription features (voice controls, live transcript states, optional lyric line-break detection, and mobile-friendly layout). Use when improving transcription UI or speech-to-text editor flows.
---

# Modern Frontend Transcribe Design

Use this skill when a task involves a transcription surface and the UI should feel modern, clear, and production-ready.

## Workflow

1. Locate the transcribe flow first.
- Find speech-recognition state and event handlers (`onresult`, `onerror`, `onend`).
- Confirm where interim transcript and final transcript are merged into editor text.

2. Upgrade UX before styling details.
- Add a dedicated transcribe panel with clear status: `Ready`, `Live`, `Unsupported`.
- Group controls together: `Record/Stop`, diagnostics, destructive actions.
- Keep optional settings visible but lightweight.

3. Implement optional lyric line-break detection.
- Add a boolean toggle (off by default).
- In `onresult`, process final chunks with two paths:
  - Normal mode: append plain compact text.
  - Lyrics mode: support explicit commands (`new line`, `line break`, `next line`, `new paragraph`) and pause-based line breaks.
- Preserve user editability; never make this mandatory.

4. Apply modern visual language.
- Use a distinct panel background (gradient/surface blend), high-contrast text, and status chips.
- Prefer CSS variables and reusable class names over one-off inline values.
- Ensure responsive behavior: controls should wrap and remain usable on narrow screens.

5. Validate behavior.
- Confirm non-lyrics mode appends as normal prose.
- Confirm lyrics mode adds line breaks only when enabled.
- Confirm record lifecycle resets transient state (`interim`, timestamps, refs) on stop/error/end.

## Quality bar

- Keep toggles and labels explicit; avoid ambiguous setting names.
- Do not remove manual text editing from the transcript textarea.
- Keep spacing and typography intentional; avoid default-looking control stacks.
- Keep implementation small and local to the transcribe feature unless broader refactor is required.
