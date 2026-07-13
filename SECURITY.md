# Security Policy

Last updated: 2026-07-13

This policy covers Meidie Fei's public security portfolio at <https://meidie.mdpstudio.com.au>. It gives recruiters, clients, and security researchers a clear way to report issues without implying enterprise SOC, compliance, or bug bounty coverage.

## Scope

In scope:

- The static portfolio site at <https://meidie.mdpstudio.com.au>.
- Public assets published from this repository, including the downloadable resume PDF.
- Public project links presented from the portfolio when the linked project is owned by Meidie Fei or MDP Studio.

Out of scope:

- GitHub, Netlify, Cloudflare, Buy Me a Coffee, LinkedIn, or other third-party platforms.
- Client-private systems, private MDP Studio infrastructure, private repositories, email accounts, or payment accounts.
- Social engineering, phishing, physical attacks, spam, denial of service, credential stuffing, or attempts to access private data.
- Destructive testing, persistence, exfiltration, or testing that changes data outside your own account or browser session.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately by email:

- Contact: <meidie@mdpstudio.com.au>
- Suggested subject: `[Security] report: Meidie security portfolio`
- Policy page: <https://meidie.mdpstudio.com.au/security>
- Artifact manifest: <https://meidie.mdpstudio.com.au/artifact-manifest.json>
- Evidence freshness methodology: <https://meidie.mdpstudio.com.au/evidence>
- Evidence registry: <https://meidie.mdpstudio.com.au/evidence-registry.json>
- Machine-readable contact: <https://meidie.mdpstudio.com.au/.well-known/security.txt>

Include:

- Affected URL, repository, or artifact.
- Reproduction steps with the minimum proof needed to confirm the issue.
- Expected impact and any relevant screenshots or logs.
- Whether you believe any data was accessed or changed.

Do not include passwords, API keys, session tokens, private client data, or unrelated personal data in the report.

## Response Expectations

This is a personal portfolio and student/practitioner project surface. I aim to acknowledge credible reports within 5 business days and provide a remediation update when the issue has been triaged. There is no paid bug bounty program.

Public disclosure should wait until the issue is fixed or a coordinated disclosure timeline has been agreed.

## Safe Testing Rules

- Use your own browser session and test data.
- Keep proof of concept steps minimal and reversible.
- Stop testing and report immediately if you encounter private data, credentials, or account boundaries.
- Do not run automated high-volume scans against the portfolio or linked demos.

## Artifact Integrity and Signing

The portfolio references public artifacts through their canonical source pages. Do not trust third-party mirrors.

- Resume PDF: <https://meidie.mdpstudio.com.au/assets/Meidie_Fei_Cyber_Security_Resume.pdf>
- Resume PDF SHA-256: `19BEBF8AA951A5702BB9D80D0B47B63592C57D420CF525F1FD99EADAF6A48F07`
- Resume signing status: The portfolio resume PDF is unsigned. Its published SHA-256 checksum supports byte-for-byte comparison but does not authenticate its origin or signer.
- Artifact manifest: <https://meidie.mdpstudio.com.au/artifact-manifest.json>
- RMM Hunter releases: <https://github.com/MDP-Studio/rmm-hunter/releases>
- RMM Hunter signing status: Current public Windows builds are unsigned beta artifacts unless a release page says otherwise.
- AES Secure Vault signing status: AES Secure Vault publishes checksums, SBOMs, and attestations; these are provenance evidence, not operating-system code signing or cryptographic certification.

When future artifacts are code-signed, checksum-published, or detached-signature-published, the portfolio should link to the relevant GitHub release, checksum, signing identity, and verification steps from this policy.

## Security Claims Boundary

The portfolio demonstrates practical security engineering, documentation, and deployment habits. It does not claim SOC 2, ISO 27001, PCI DSS, formal penetration-test attestation, or continuous monitoring coverage unless a separate project page provides verified evidence.
