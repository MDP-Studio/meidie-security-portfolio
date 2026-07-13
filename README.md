# Meidie Security Portfolio

Standalone static portfolio showcase for recruiters.

Live URL: <https://meidie.mdpstudio.com.au>

MDP Studio: <https://mdpstudio.com.au/>

Canonical MDP project page: <https://mdpstudio.com.au/projects/meidie-security-portfolio/>

Historical Netlify fallback: <https://meidie-security-portfolio.netlify.app>

## Files

- `index.html` - complete portfolio page with inline CSS and JavaScript.
- `SECURITY.md` - public vulnerability-reporting policy and artifact-integrity notes.
- `security.html` - deployable web version of the security policy.
- `artifact-manifest.json` - machine-readable artifact integrity and provenance surface.
- `evidence-registry.json` - reviewed project, policy, release, commit, and signing/provenance disclosure sources with a 45-day review window.
- `evidence.html` - public evidence-freshness methodology and report entry point.
- `reports/evidence-freshness.*` - latest live Markdown and JSON snapshot generated at deployment time.
- `.well-known/security.txt` - machine-readable security contact surface.
- `robots.txt` and `sitemap.xml` - crawler entry points for the public portfolio and security contact surface.
- `assets/` - project screenshots, favicon, and downloadable resume assets.
- `public/` - allowlisted deployable copy used by the production nginx container.
- `deploy/` - reproducible Coolify Dockerfile, nginx routes, security headers, and deployment contract.
- `tools/check_evidence_freshness.js` - validates live evidence or deterministic offline fixtures without logging response bodies or secrets.
- `tools/sync_public.sh` - syncs the source HTML, crawler files, policies, manifests, evidence reports, redirects, and public assets into `public/`.
- `tools/generate_assets.py` - regenerates the bitmap project visuals.

## Deployment

This site has no application build step. `tools/sync_public.sh` creates the
allowlisted static bundle, then the existing Coolify compose application builds
it with `deploy/Dockerfile` and `deploy/nginx.conf`.

Current target:

- Production URL: <https://meidie.mdpstudio.com.au>
- Hosting: static nginx container managed by Coolify.
- Public route: existing Cloudflare Tunnel for `meidie.mdpstudio.com.au`

Private overlay addresses, remote paths, and container identifiers belong in the
internal MDP deployment runbook, not this public repository.

The previous Netlify site remains a rollback reference only. Do not run the old
DNS action or reattach the production custom domain to Netlify. See
[`DEPLOYMENT.md`](DEPLOYMENT.md) and [`deploy/README.md`](deploy/README.md).

## GitHub Actions

The workflow at `.github/workflows/deploy.yml` does the following on `main`:

- Runs the evidence checker tests and a live public evidence check.
- Generates non-secret Markdown and JSON evidence reports.
- Syncs and verifies the public deploy directory.
- Uploads the verified `public/` directory as a workflow artifact.
- Does not deploy, mutate DNS, or attach the dormant Netlify fallback.

The separate `.github/workflows/evidence-freshness.yml` workflow runs every
Monday at 02:17 UTC and on demand. It fails on errors and unwaived warnings,
writes the report to the job summary, and uploads the report as a workflow
artifact. It does not commit generated output or expose response bodies, headers,
credentials, tokens, cookies, query strings, or private repository data.

Run the checker locally:

```bash
node --test tests/evidence_freshness.test.js
node tools/check_evidence_freshness.js
bash tools/sync_public.sh
node tools/check_page.js
```

The live check fails when a reviewed project commit moves and reports expected
review work such as a recommended missing `SECURITY.md`. Registry and manifest
review timestamps expire after 45 days. A clean report confirms only the
configured public surfaces at that moment and is not a security certification.

Network checks use an explicit hostname allowlist, reject private address ranges,
and revalidate redirects. They still rely on public DNS for the approved GitHub,
PyPI, and portfolio hostnames. Public content markers may be compared in memory,
but response bodies, headers, credentials, tokens, cookies, and query strings are
never written to the reports.

Known baseline warning: `MDP-Studio/cf-dns-action` does not currently publish a
repository `SECURITY.md`. It is outside this remediation slice, so the registry
keeps the recommendation visible under an accepted-risk waiver that expires on
2026-08-31. The scheduled workflow does not fail solely on this active waiver,
but an expired waiver becomes an error.

The production security-header policy is kept in `deploy/nginx.conf`; the
historical Netlify fallback mirrors it in `netlify.toml`. It includes HSTS, CSP,
clickjacking and MIME-sniffing defenses, permissions restrictions, referrer
policy, and cross-origin policies. Verify those headers on the custom domain after
each production deployment rather than assuming the hosting layer applied them.

## Security Reporting

Vulnerability reports for the portfolio should be sent privately to <meidie@mdpstudio.com.au> with the subject `[Security] report: Meidie security portfolio`.

Public discovery surfaces:

- Web policy: <https://meidie.mdpstudio.com.au/security>
- GitHub policy: [`SECURITY.md`](SECURITY.md)
- Artifact manifest: <https://meidie.mdpstudio.com.au/artifact-manifest.json>
- Evidence freshness: <https://meidie.mdpstudio.com.au/evidence>
- Evidence registry: <https://meidie.mdpstudio.com.au/evidence-registry.json>
- security.txt: <https://meidie.mdpstudio.com.au/.well-known/security.txt>

## Updating Resume Files

The page links to:

- `assets/Meidie_Fei_Cyber_Security_Resume.pdf`

Edit `resume/Meidie_Fei_Cyber_Security_Resume.md`, then run:

```bash
python -m pip install python-docx reportlab
python resume/build_resume_assets.py
```

The generic public PDF is written to `assets/`. Application-specific resumes and cover letters should stay under ignored local folders such as `applications/agoda/`.

## Regenerate Visual Assets

```bash
python tools/generate_assets.py
```

The script uses Pillow and writes JPEG assets into `assets/`.
