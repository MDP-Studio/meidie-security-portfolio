# Deployment Notes

## Netlify

- Project name: `meidie-security-portfolio`
- Project ID: `b7853f9a-8551-48f2-9a10-13ba3863a854`
- Production URL: `https://meidie-security-portfolio.netlify.app`
- Admin URL: `https://app.netlify.com/projects/meidie-security-portfolio`
- Last deploy ID: `69f02419df6d95d374b1e36e`

Deploy command from this folder:

```bash
cmd.exe /c netlify deploy --site meidie-security-portfolio --prod --dir public --no-build
```

## Custom Domain Plan

Recommended recruiter-facing URL:

- `meidie.mdpstudio.com.au`

DNS target:

- `meidie-security-portfolio.netlify.app`

Use the `DNS add` action pattern after refreshing the Cloudflare token:

```yaml
uses: MDP-Studio/cf-dns-action@v1
with:
  subdomain: meidie
  netlify-site-id: b7853f9a-8551-48f2-9a10-13ba3863a854
  netlify-auth-token: ${{ secrets.NETLIFY_AUTH_TOKEN }}
  cf-zone-id: ${{ secrets.CF_ZONE_ID }}
  cf-api-token: ${{ secrets.CF_API_TOKEN }}
  wait-for-cert: true
```

The repo workflow is in `.github/workflows/deploy.yml`. It deploys the static portfolio to Netlify, then runs the DNS action to attach `meidie.mdpstudio.com.au`.

## Current Blocker

The old local Cloudflare token in `/mnt/d/personal project/DNS add/.env` returned `401 Unauthorized` on 2026-04-28. The GitHub organization secrets now contain `CF_API_TOKEN`, `CF_ZONE_ID`, and `NETLIFY_AUTH_TOKEN`; run the GitHub workflow from a repo that can access those organization secrets.
