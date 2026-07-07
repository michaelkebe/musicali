# Changelog

## [Unreleased]

### Added

- New WCS patterns: basic-whip-outside-turn, basic-whip-inside-turn, reverse-whip, same-side-whip, behind-the-back-whip, basket-whip (8-count); roll-in-roll-out, torque-turn, free-spin (6-count); renamed underarm → underarm-turn
- Loading patterns from localStorage now validates `patternId` against known definitions; invalid IDs are dropped with a console warning instead of crashing the UI

## [0.1.0] - 2026-07-07

### Added

- Metronome click (Web Audio API) with toggle button, synced to beat playback; beat 1 of each 8-count is higher-pitched
- E2E tests for PLL tapper precision (perfect, slight jitter, sloppy jitter)
- E2E helper `tapScheduled` for deterministic tapping with synthetic timestamps

### Changed

- All `onMouseDown` handlers replaced with `onPointerDown` for immediate mobile touch response
- Added `touch-action: manipulation` to all interactive elements to suppress 300ms tap delay
- Playback bar restructured into three rows (tempo controls, playback controls, utility + beat display)
- Trimmer buttons now shown in both AVG and PLL modes
- All control buttons increased to 4rem height for visual consistency
- PLL tracking LERP values retuned for better stability (offset 0.6→0.3, interval 0.001→0.005)

### Fixed

- PLL-derived BPM now persists to localStorage instead of only the legacy averaged BPM
- PLL reset button now also clears saved BPM, preventing the seed effect from immediately re-seeding the PLL
- Tap reset now clears the internal tap buffer synchronously instead of via useEffect, fixing a race where a quick tap after reset would recompute BPM from stale data
- PLL tracking phase now skips interval updates when the gap from the last tap exceeds 2.5 beats, preventing a single isolated tap from corrupting the tempo estimate
- Announcement target beat off-by-one (0-indexed vs 1-indexed)

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
