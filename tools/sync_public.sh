#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$ROOT/public/assets"
mkdir -p "$ROOT/public/.well-known"
cp "$ROOT/index.html" "$ROOT/public/index.html"
cp "$ROOT/robots.txt" "$ROOT/public/robots.txt"
cp "$ROOT/sitemap.xml" "$ROOT/public/sitemap.xml"
cp "$ROOT/security.html" "$ROOT/public/security.html"
cp "$ROOT/SECURITY.md" "$ROOT/public/SECURITY.md"
cp "$ROOT/_redirects" "$ROOT/public/_redirects"
cp "$ROOT/.well-known/security.txt" "$ROOT/public/.well-known/security.txt"

for asset in \
  favicon.jpg \
  Meidie_Fei_Cyber_Security_Resume.pdf \
  screenshot-payshield.png \
  screenshot-phishanalyze.png \
  screenshot-rmm-hunter.png \
  screenshot-cryptotoolkit.png \
  screenshot-securevote.png \
  screenshot-command-center.png
do
  cp "$ROOT/assets/$asset" "$ROOT/public/assets/$asset"
done

echo "Synced deployable site into $ROOT/public"
