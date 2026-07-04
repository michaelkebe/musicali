# Changelog

## [Unreleased]

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
