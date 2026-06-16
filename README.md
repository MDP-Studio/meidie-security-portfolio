# Meidie Security Portfolio

Standalone static portfolio showcase for recruiters.

Live URL: <https://meidie.mdpstudio.com.au>

Fallback Netlify URL: <https://meidie-security-portfolio.netlify.app>

## Files

- `index.html` - complete portfolio page with inline CSS and JavaScript.
- `SECURITY.md` - public vulnerability-reporting policy and artifact-integrity notes.
- `security.html` - deployable web version of the security policy.
- `.well-known/security.txt` - machine-readable security contact surface.
- `robots.txt` and `sitemap.xml` - crawler entry points for the public portfolio and security contact surface.
- `assets/` - project screenshots, favicon, and downloadable resume assets.
- `public/` - deployable copy used by Netlify.
- `tools/sync_public.sh` - syncs the source HTML, crawler files, policy files, security contact file, redirects, and public assets into `public/`.
- `tools/generate_assets.py` - regenerates the bitmap project visuals.

## Deployment

This site has no build step. Deploy the `meidie-security-portfolio` directory as a static site, or copy the contents into the target MDP Studio deployment folder.

Suggested paths:

- `portfolio.mdpstudio.com.au`
- `meidie.mdpstudio.com.au`
- `mdpstudio.com.au/meidie`

## Netlify Setup

This folder includes `netlify.toml` for Netlify static hosting.

Current Netlify project:

- Project name: `meidie-security-portfolio`
- Project ID: `b7853f9a-8551-48f2-9a10-13ba3863a854`
- URL: <https://meidie-security-portfolio.netlify.app>
- Custom domain: <https://meidie.mdpstudio.com.au>

Recommended Netlify settings:

- Base directory: `meidie-security-portfolio` if deploying from the parent project/repository.
- Build command: leave empty.
- Publish directory: `public`.

CLI flow:

```bash
npx netlify login
npx netlify init
npx netlify deploy --prod --dir public
```

If the Codex Netlify plugin is available in a new session, use it from this folder and choose the same settings.

## GitHub Actions

The workflow at `.github/workflows/deploy.yml` does two things on `main`:

- Runs the static page checks and syncs the public deploy directory.
- Deploys `public/` to the existing Netlify project.
- Runs `MDP-Studio/cf-dns-action@v1` to connect `meidie.mdpstudio.com.au`.

## Security Reporting

Vulnerability reports for the portfolio should be sent privately to <meidie@mdpstudio.com.au> with the subject `[Security] report: Meidie security portfolio`.

Public discovery surfaces:

- Web policy: <https://meidie.mdpstudio.com.au/security>
- GitHub policy: [`SECURITY.md`](SECURITY.md)
- security.txt: <https://meidie.mdpstudio.com.au/.well-known/security.txt>

Required organization secrets:

- `CF_API_TOKEN`
- `CF_ZONE_ID`
- `NETLIFY_AUTH_TOKEN`

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
