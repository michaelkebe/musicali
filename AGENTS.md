# Musicali — WCS musicality trainer

## Stack

Vite + React 19 + TypeScript 6. Single-page app, no backend.

## Commands

```sh
npm run dev      # Vite dev server (port 5173)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Structure

```
src/
  App.tsx               # root: state, pattern placement logic
  components/
    PatternPalette.tsx   # left sidebar: pattern list
    PhraseTimeline.tsx   # 128-beat grid with pattern overlays
    PlaybackBar.tsx      # BPM tap counter + playback controls
  data/patterns.ts      # WCS pattern definitions (4×8-count, 6×6-count)
  types.ts              # PatternDef, PlacedPattern
```

## Key model

- **PatternDef**: `{ id, name, beats: 6|8 }`
- **PlacedPattern**: `{ id, patternId, startBeat }` — a pattern instance on the timeline
- Timeline: 128 beats, 8 beats/row, 4 phrases of 32 beats
- Overlap prevention: `allPatterns` lookup + overlap check in `setPlaced` updater

## Interaction

- Single-click palette → select, then click beat to place
- Double-click palette → auto-places on next free beat
- **ONLY commit when told** — never commit without an explicit request

## Gotchas

- `verbatimModuleSyntax` — use `import type` for type-only imports
- `erasableSyntaxOnly` — no enums, no namespaces, no parameter properties
- No tests yet

## Release

- Deploy happens via GitHub Actions when a tag matching `v*` is pushed to `master`.
- Version bumps in `package.json`/`package-lock.json` and `CHANGELOG.md` are done as separate commits before tagging.
- The tag should match the version in `package.json` (e.g., `v0.0.2`).
- Do **not** tag without an explicit request.
