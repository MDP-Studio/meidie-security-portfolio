# Coolify Static Deployment

The production portfolio is served by a static nginx container on the existing
Coolify host. The custom domain is routed through the existing Cloudflare Tunnel.
The previous Netlify site remains a fallback only and must not reclaim the custom
domain.

- Production URL: <https://meidie.mdpstudio.com.au>
- Base image: `nginx:1.30.3-alpine` pinned to manifest digest
  `sha256:0d3b80406a13a767339fbe2f41406d6c7da727ab89cf8fae399e81f780f814d1`.
  It was the current stable Alpine tag documented by the
  [nginx Docker Official Image](https://hub.docker.com/_/nginx) when reviewed on
  2026-07-13.

The exact overlay host, compose directory, static bundle path, and container name
are intentionally kept in the private MDP deployment runbook.

`nginx.conf` is the production security-header and routing source. Keep it aligned
with the fallback `netlify.toml`, but verify the live nginx response because
Netlify settings are not interpreted by Coolify.

## Local gate

```bash
node --test tests/evidence_freshness.test.js
node tools/check_evidence_freshness.js
bash tools/sync_public.sh
node tools/check_page.js
docker run --rm -v "$PWD/deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro" nginx:1.30.3-alpine@sha256:0d3b80406a13a767339fbe2f41406d6c7da727ab89cf8fae399e81f780f814d1 nginx -t
```

## Bundle contract

Copy the complete `public/` directory into a fresh remote staging directory, then
copy `deploy/Dockerfile` and `deploy/nginx.conf` into its root as `Dockerfile` and
`nginx.conf`. Required deployment evidence includes:

- `index.html`, `security.html`, `evidence.html`, and extensionless routing;
- `SECURITY.md`, `artifact-manifest.json`, and `evidence-registry.json`;
- `reports/evidence-freshness.md` and `.json`;
- `.well-known/security.txt`, `robots.txt`, and `sitemap.xml`;
- only the whitelisted assets produced by `tools/sync_public.sh`;
- the Dockerfile and nginx configuration from this directory.

Keep a timestamped copy of the previous remote `app` directory before replacing
the bundle. Build first while the previous container remains available, then use
the existing compose file with `up -d --build --force-recreate --wait`.

## Live verification

Verify `/`, `/security`, `/evidence`, the two manifests, both evidence report
formats, and `/.well-known/security.txt`. Confirm the response includes HSTS, CSP,
frame denial, MIME-sniffing denial, referrer and permissions policies, and the two
cross-origin policies. Confirm `/security-policy` and `/evidence-health` redirect
to their canonical routes.

Do not claim completion from a successful container build alone. Check the public
Cloudflare hostname and confirm the new evidence marker and reviewed commit
prefixes are present.

GitHub Actions are pinned to immutable commits and the nginx base image is pinned
to an OCI digest. Review upstream release notes and update the human-readable
version comments and immutable references together in a dedicated maintenance
change.
