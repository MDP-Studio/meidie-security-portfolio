#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$ROOT/public/assets"
cp "$ROOT/index.html" "$ROOT/public/index.html"

for asset in \
  favicon.jpg \
  Meidie_Fei_Cyber_Security_Resume.pdf \
  screenshot-phishanalyze.png \
  screenshot-cryptotoolkit.png \
  screenshot-securevote.png \
  screenshot-command-center.png
do
  cp "$ROOT/assets/$asset" "$ROOT/public/assets/$asset"
done

echo "Synced deployable site into $ROOT/public"
