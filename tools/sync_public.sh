#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$ROOT/public/assets"
cp "$ROOT/index.html" "$ROOT/public/index.html"
cp "$ROOT/assets/"* "$ROOT/public/assets/"

echo "Synced deployable site into $ROOT/public"
