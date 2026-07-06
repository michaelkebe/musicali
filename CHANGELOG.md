# Changelog

## [Unreleased]

### Added

- Metronome click (Web Audio API) with toggle button, synced to beat playback; beat 1 of each 8-count is higher-pitched

### Changed

- All `onMouseDown` handlers replaced with `onPointerDown` for immediate mobile touch response
- Added `touch-action: manipulation` to all interactive elements to suppress 300ms tap delay

### Fixed

- PLL-derived BPM now persists to localStorage instead of only the legacy averaged BPM

## [0.0.8] - 2026-07-06

### Added

- PLL beat-tracking mode with configurable phase thresholds
- E2E tests for PLL phase progression and beat-timing accuracy

### Fixed

- Cumulative beat-timing drift: playback loop now schedules next beat from the previous deadline (`nextBeatTimeRef + interval`) instead of the current `performance.now()`, preventing drift over long phrases

## [0.0.5] - 2026-07-04

### Changed

- Release process: automated script, version consistency check, post-deploy smoke test
- Removed unused `gh-pages` dependency

## [0.0.4] - 2026-07-04

### Changed

- Version badge in header links to CHANGELOG.md on GitHub

## [0.0.3] - 2026-07-04

### Changed

- Release process: deploy only on git tags matching `v*`
- Removed unused dependencies (`wavesurfer.js`, `react-text-to-speech`)

## [0.0.2] - 2026-07-04

### Fixed

- Pattern announcement wraps around the 128-beat boundary so patterns at beats 1–3 are announced when the current beat is at 126–128 instead of being silently skipped.
