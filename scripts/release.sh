#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
[ -n "$VERSION" ] || { echo "Usage: $0 <version> (e.g. 0.0.5)"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Uncommitted changes"; exit 1; }

npm version "$VERSION" --no-git-tag-version

PKG=$(node -p "require('./package.json').version")
LOCK=$(node -p "require('./package-lock.json').version")
[ "$PKG" = "$LOCK" ] || { echo "Version mismatch: $PKG != $LOCK"; exit 1; }

npm run build

sed -i "s/## \[Unreleased\]/## [$VERSION] - $(date +%F)/" CHANGELOG.md

git add package.json package-lock.json CHANGELOG.md
git commit -m "release: v$VERSION"
git tag "v$VERSION"

echo "Done. Push with: git push && git push origin v$VERSION"
