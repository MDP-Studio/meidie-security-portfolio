# Portfolio Evidence Freshness Report

- Checked at: 2026-07-13T12:44:36.810Z
- Mode: live
- Projects and artifact groups: 9
- Findings: 0 errors, 1 warnings (1 accepted risk, 0 actionable)

Reports include only public URLs, HTTP status classes, and commit prefixes. Response bodies, headers, credentials, tokens, and URL query strings are never included.

## Coverage

| Project | Links | Commit reference | Security policy | Artifact trust |
| --- | ---: | --- | --- | --- |
| PhishAnalyze and PayShield | 4/4 | current (5eb19ee69b54) | present | not-applicable |
| RMM Hunter | 5/5 | current (d371d3f637cf) | present | unsigned-disclosed |
| SecureVote | 2/2 | current (123c66b6804d) | present | not-applicable |
| CryptoToolkit | 4/4 | current (9261edc5ed6d) | present | not-applicable |
| AES Secure Vault | 6/6 | current (4b4e2a369632) | present | attested-not-code-signed |
| Cloudflare DNS Action | 1/1 | current (b76966103580) | missing, accepted risk until 2026-08-31 | not-applicable |
| Cyber Command Center | 3/3 | current (932f8067d9fc) | present | not-applicable |
| Meidie Security Portfolio | 10/10 | observed e37e81c95e47 | present | checksum-only-unsigned |
| Portfolio artifacts | 6/6 | not tracked | not-applicable | manifest |

## Findings

| Severity | Project | Check | Evidence |
| --- | --- | --- | --- |
| WARNING (accepted risk until 2026-08-31) | cloudflare-dns-action | security-policy | No SECURITY.md policy was found (recommended). Accepted risk owned by Portfolio maintainers until 2026-08-31: Cloudflare DNS Action was explicitly excluded from this remediation slice. Reassess the repository policy gap before this date. (https://github.com/MDP-Studio/cf-dns-action) |

## Interpretation

- An error means a required public link, policy, manifest rule, local hash, or disclosure failed validation.
- An actionable warning means an automated check was inconclusive or a non-required gap needs review.
- An accepted-risk warning stays visible until its documented expiry date; an expired waiver becomes an error.
- A clean report confirms only the configured public evidence surfaces at the check time. It does not certify project security.
