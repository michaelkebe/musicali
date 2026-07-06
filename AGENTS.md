# Musicali — WCS musicality trainer

## Stack

Vite + React 19 + TypeScript 6. Single-page app, no backend.

## Commands

```sh
npm run dev      # Vite dev server (port 5173)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
npm test         # vitest run (unit + integration)
npm run test:e2e # playwright test (browser E2E)
```

## Structure

```
src/
  App.tsx               # root: state, pattern placement logic
  components/
    PatternPalette.tsx   # left sidebar: pattern list
    PhraseTimeline.tsx   # 128-beat grid with pattern overlays
    PlaybackBar.tsx      # BPM tap counter + playback controls
  hooks/
    usePllBeat.ts       # PLL beat tracking (fitLine, pllReducer)
  utils/
    bpm.ts              # Legacy tap averaging BPM calc
  data/patterns.ts      # WCS pattern definitions (4×8-count, 6×6-count)
  types.ts              # PatternDef, PlacedPattern, PllState
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

## Release

- Deploy happens via GitHub Actions when a tag matching `v*` is pushed to `master`.
- Use `./scripts/release.sh <version>` to bump, commit, and tag.
  - Example: `./scripts/release.sh 0.0.5 && git push && git push origin v0.0.5`
- The script validates: clean working tree, lockfile match, build succeeds.
- Do **not** tag manually or without an explicit request.
