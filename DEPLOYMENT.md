# Deployment Notes

## Current production target

The portfolio is a static nginx application on the existing Coolify host.

- Production URL: `https://meidie.mdpstudio.com.au`
- GitHub repository: `https://github.com/MDP-Studio/meidie-security-portfolio`
- Hosting: static nginx container managed by Coolify
- Routing: existing Cloudflare Tunnel for `meidie.mdpstudio.com.au`

The previous Netlify site is a historical fallback. Do not run the old DNS
action or attach the custom domain to Netlify. Exact overlay addresses, remote
paths, site identifiers, and container identifiers stay in the private MDP
deployment runbook.

## Preflight

Run from the repository root:

```bash
node --test tests/evidence_freshness.test.js
node tools/check_evidence_freshness.js
bash tools/sync_public.sh
node tools/check_page.js
docker run --rm -v "$PWD/deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:1.30.3-alpine@sha256:0d3b80406a13a767339fbe2f41406d6c7da727ab89cf8fae399e81f780f814d1 nginx -t
```

Do not deploy when the evidence checker reports errors. Review warnings before
continuing. The accepted baseline warning for this slice is the missing
`SECURITY.md` in `MDP-Studio/cf-dns-action`, which remains visible because that
project is outside scope.

## Remote update pattern

1. Copy the entire local `public/` directory to a new timestamped staging path on
   `<coolify-host>` from the private deployment runbook.
2. Copy `deploy/Dockerfile` and `deploy/nginx.conf` into that staged bundle.
3. Verify the staged absolute path and required files before changing the current
   application directory.
4. Preserve the current remote `app` as a timestamped rollback copy.
5. Move the staged bundle into `app`, then run:

```bash
cd <portfolio-compose-directory>
docker compose -f docker-compose.yaml build
docker compose -f docker-compose.yaml up -d --force-recreate --wait
```

The previous container remains available during the build. Keep the rollback copy
until live verification passes.

## Reproducible hosting controls

Production uses `deploy/Dockerfile` and `deploy/nginx.conf`. The nginx config
contains extensionless static routing, explicit redirects, static-asset caching,
and the following response controls:

- Strict-Transport-Security;
- Content-Security-Policy;
- X-Frame-Options and `frame-ancestors`;
- X-Content-Type-Options;
- Referrer-Policy and Permissions-Policy;
- Cross-Origin-Opener-Policy and Cross-Origin-Resource-Policy;
- X-Permitted-Cross-Domain-Policies.

The CSP permits first-party scripts and styles plus the small inline JSON-LD and
chart-height declarations used by the static portfolio. It blocks third-party
scripts and styles, plugins, frames, and network connections. `netlify.toml`
mirrors these headers only for the dormant fallback host.

## Live checks

Verify status and content for:

- `/`
- `/security` and `/security.html`
- `/evidence` and `/evidence.html`
- `/artifact-manifest.json`
- `/evidence-registry.json`
- `/reports/evidence-freshness.md`
- `/reports/evidence-freshness.json`
- `/.well-known/security.txt`
- `/robots.txt` and `/sitemap.xml`

Confirm `/security-policy` redirects to `/security` and `/evidence-health`
redirects to `/evidence`. Inspect headers on the canonical custom domain, not only
the private origin. Record the deployed source commit, container health, and
timestamp after verification.

## GitHub Actions

`.github/workflows/deploy.yml` verifies and uploads a deployable `public/` bundle;
it does not mutate DNS or deploy to the dormant Netlify project.

`.github/workflows/evidence-freshness.yml` runs weekly without deploying or
committing changes. It publishes the non-secret evidence report to the job summary
and an uploaded workflow artifact.
