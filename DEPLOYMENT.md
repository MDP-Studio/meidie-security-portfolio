# Deployment Notes

## Netlify

- Project name: `meidie-security-portfolio`
- Project ID: `b7853f9a-8551-48f2-9a10-13ba3863a854`
- Production URL: `https://meidie-security-portfolio.netlify.app`
- Custom domain: `https://meidie.mdpstudio.com.au`
- Admin URL: `https://app.netlify.com/projects/meidie-security-portfolio`
- Last deploy ID: `69f02419df6d95d374b1e36e`
- GitHub repo: `https://github.com/MDP-Studio/meidie-security-portfolio`
- Last successful workflow: `https://github.com/MDP-Studio/meidie-security-portfolio/actions/runs/25032629496`

Deploy command from this folder:

```bash
bash tools/sync_public.sh
cmd.exe /c netlify deploy --site meidie-security-portfolio --prod --dir public --no-build
```

The sync step publishes `index.html`, `security.html`, `SECURITY.md`, `_redirects`, `/.well-known/security.txt`, and the whitelisted public assets into `public/`.

## Custom Domain

Recruiter-facing URL:

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

## Notes

The GitHub organization secrets contain `CF_API_TOKEN`, `CF_ZONE_ID`, and `NETLIFY_AUTH_TOKEN`. The first successful workflow run deployed the site and attached `meidie.mdpstudio.com.au` on 2026-04-28.
