#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC="$ROOT/public"
STAGE="$(mktemp -d "$ROOT/.public-sync.XXXXXX")"

cleanup() {
  find "$STAGE" -depth -mindepth 1 -delete 2>/dev/null || true
  rmdir "$STAGE" 2>/dev/null || true
}
trap cleanup EXIT

if [[ -L "$PUBLIC" ]] || find "$PUBLIC" -type l -print -quit 2>/dev/null | grep -q .; then
  echo "Refusing to sync into a public directory that contains symlinks." >&2
  exit 1
fi

mkdir -p "$STAGE/assets"
mkdir -p "$STAGE/.well-known"
mkdir -p "$STAGE/reports"
cp "$ROOT/index.html" "$STAGE/index.html"
cp "$ROOT/robots.txt" "$STAGE/robots.txt"
cp "$ROOT/sitemap.xml" "$STAGE/sitemap.xml"
cp "$ROOT/security.html" "$STAGE/security.html"
cp "$ROOT/evidence.html" "$STAGE/evidence.html"
cp "$ROOT/SECURITY.md" "$STAGE/SECURITY.md"
cp "$ROOT/artifact-manifest.json" "$STAGE/artifact-manifest.json"
cp "$ROOT/evidence-registry.json" "$STAGE/evidence-registry.json"
cp "$ROOT/reports/evidence-freshness.md" "$STAGE/reports/evidence-freshness.md"
cp "$ROOT/reports/evidence-freshness.json" "$STAGE/reports/evidence-freshness.json"
cp "$ROOT/_redirects" "$STAGE/_redirects"
cp "$ROOT/.well-known/security.txt" "$STAGE/.well-known/security.txt"

for asset in \
  favicon.jpg \
  linkedin-featured-portfolio.png \
  Meidie_Fei_Cyber_Security_Resume.pdf \
  site.css \
  site.js \
  screenshot-payshield.png \
  screenshot-securevote.png
do
  cp "$ROOT/assets/$asset" "$STAGE/assets/$asset"
done

mkdir -p "$PUBLIC"
cp -R "$STAGE/." "$PUBLIC/"
while IFS= read -r -d '' deployed; do
  relative="${deployed:${#PUBLIC}+1}"
  if [[ ! -f "$STAGE/$relative" ]]; then
    rm -f -- "$deployed"
  fi
done < <(find "$PUBLIC" -type f -print0)
find "$PUBLIC" -depth -mindepth 1 -type d -empty -delete

echo "Synced deployable site into $PUBLIC"
