# Musicali — WCS Musicality Trainer

Visualize and arrange West Coast Swing patterns on a 128-beat timeline. Helps with phrasing, musicality, and choreography planning.

## Features

- **Pattern palette** — 6-count and 8-count WCS patterns. Single-click to select then place on a beat; double-click to auto-place on the next free beat.
- **128-beat timeline** — 4 phrases of 32 beats, each beat is a click target. Patterns render as colored overlays with overlap prevention.
- **BPM tap** — tap (1/2/4) to set tempo, or trim with fine-grained ±0.001 steps. Mic-based real-time BPM detection available.
- **Playback** — beat cursor advances at the set BPM. Pattern announcements via speech synthesis (togglable).
- **Nudge** — shift playback timing ±10ms/±100ms during playback.
- **Persistence** — patterns, BPM, and announce preference saved to localStorage.

## Stack

React 19, TypeScript 6, Vite. Single-page app, no backend.

## Commands

```sh
npm run dev      # Vite dev server (port 5173)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```
