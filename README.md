# Meidie Security Portfolio

Standalone static portfolio showcase for recruiters.

Live Netlify URL: <https://meidie-security-portfolio.netlify.app>

## Files

- `index.html` - complete portfolio page with inline CSS and JavaScript.
- `assets/` - generated project visuals, favicon, and downloadable resume assets.
- `public/` - deployable copy used by Netlify.
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

- Deploys `public/` to the existing Netlify project.
- Runs `MDP-Studio/cf-dns-action@v1` to connect `meidie.mdpstudio.com.au`.

Required organization secrets:

- `CF_API_TOKEN`
- `CF_ZONE_ID`
- `NETLIFY_AUTH_TOKEN`

## Updating Resume Files

The page links to:

- `assets/Meidie_Fei_Resume_Agoda_Security_Analyst.pdf`
- `assets/Meidie_Fei_Resume_Agoda_Security_Analyst.docx`

Replace those files when the resume changes.

## Regenerate Visual Assets

```bash
python tools/generate_assets.py
```

The script uses Pillow and writes JPEG assets into `assets/`.
