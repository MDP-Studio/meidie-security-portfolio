# Portfolio Project Audit Workflow

Use this workflow to polish, verify, publish, and merge portfolio projects in a repeatable way. The goal is to make each project easier for recruiters and technical reviewers to understand, while keeping the repository clean and evidence-based.

## When to Use

Use this for each public portfolio project before linking it in resumes, applications, LinkedIn, or the portfolio site.

Good targets:

- Security engineering projects
- AI and automation projects
- Frontend demos and product sites
- Python packages and CLI tools
- GitHub Actions or infrastructure utilities
- Trading or data projects, with extra validation rigor

## Core Principle

The value is evidence. Visuals help, but the strongest recruiter-facing work is:

- clear README positioning
- explicit security or engineering controls
- reproducible local demo steps
- verifiable tests
- clean repo hygiene
- screenshots stored in the repo
- merged PRs with a concise audit trail

## Phase 1: Project Discovery

Start inside the target project folder.

```bash
pwd
rg --files -g 'README.md' -g 'AGENTS.md' -g 'CLAUDE.md' -g 'CONTEXT.md' -g 'package.json' -g 'pyproject.toml' -g 'requirements.txt' -g '.gitignore' -g 'pytest.ini'
git status --short --branch
git remote -v
```

Read the project-specific context before editing:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTEXT.md`
- package or dependency files
- existing docs under `docs/`
- test configuration and CI files

Identify:

- stack and run command
- test command
- build command
- live demo link, if any
- screenshots or assets already available
- current branch and remote
- whether the repo has unrelated local changes

Stop and ask only if unrelated changes make the scope unsafe.

## Phase 2: Evidence Audit

Map the project claims to concrete evidence.

For security projects, verify and document:

- threat model or risk addressed
- authentication and authorization controls
- encryption and key management
- audit logging or integrity checks
- input validation and rate limiting
- WAF, security headers, or deployment controls
- tests for abuse cases and edge cases
- limitations and safe demo boundaries

For AI or automation projects, verify and document:

- input and output workflow
- model or API boundary
- privacy and data handling assumptions
- failure modes and fallback behavior
- reproducible examples
- evaluation or test coverage

For frontend projects, verify and document:

- actual usable interface, not only a landing page
- responsive layout
- screenshots
- local run command
- deployment URL, if public
- build and lint status

For trading or data projects, verify and document:

- data source and time range
- leakage controls
- backtest assumptions
- transaction costs and slippage assumptions
- metrics and drawdowns
- limitations and experimental status

## Phase 3: GitHub Metadata

Before or during README polish, check the repository "About" metadata. Recruiters often see the GitHub card before they open the README.

Verify:

- repository description is specific and recruiter-readable
- homepage URL points to the live demo, portfolio case study, package page, or docs
- topics are relevant, lowercase, and not noisy
- pinned repository title and README title are aligned

Check current metadata:

```bash
gh repo view OWNER/REPO --json description,homepageUrl,repositoryTopics
```

If `gh` is unavailable, check the GitHub repository page manually under the About panel.

Description guidelines:

- Use one clear sentence.
- Mention the project type and key evidence.
- Keep it practical, not hype-driven.
- Avoid generic phrases like "awesome app" or "final project".

Good description patterns:

```text
Secure electronic voting platform with blind signatures, encrypted PII, HMAC audit logs, WAF rules, Vault signing, and race-condition tests.

Async phishing analysis pipeline with SPF, DKIM, DMARC, URL detonation, brand impersonation checks, analyst feedback, and STIX IOC export.

Cryptography learning toolkit with interactive modules, real attack demos, NIST/RFC vectors, and automated tests.
```

Topic guidelines:

- Use 8 to 15 focused topics.
- Prefer searchable technical keywords.
- Use lowercase hyphenated topics.
- Include the role signal when useful, such as `cybersecurity`, `security-tools`, `application-security`, or `secure-software`.
- Avoid duplicate meanings and vague topics.

Example topics by project type:

Security web app:

```text
cybersecurity, application-security, secure-software, flask, sqlalchemy, cryptography, blind-signatures, audit-logging, waf, hashicorp-vault, pytest
```

Phishing detection:

```text
cybersecurity, phishing-detection, threat-intelligence, email-security, fastapi, async-python, stix, osint, security-automation
```

Cryptography toolkit:

```text
cryptography, cybersecurity, security-education, python, javascript, rsa, aes-gcm, ecdsa, attack-demos, test-vectors
```

Frontend security portfolio:

```text
cybersecurity-portfolio, security-analyst, frontend, netlify, responsive-design, case-studies
```

Update metadata with GitHub CLI when available:

```bash
gh repo edit OWNER/REPO --description "Clear one-sentence description"
gh repo edit OWNER/REPO --homepage "https://example.com"
gh repo edit OWNER/REPO --add-topic cybersecurity --add-topic application-security --add-topic pytest
```

If topics already exist, review them first and remove noisy or misleading ones in the GitHub UI if needed.

Record metadata changes in the PR body:

```markdown
## GitHub Metadata
- Description: updated to describe the project evidence clearly.
- Homepage: set to `[URL]`.
- Topics: added focused topics for stack, domain, and recruiter search.
```

## Phase 4: README Polish

Put the most useful evidence near the top.

Recommended README structure:

1. Project name and one-sentence value statement
2. Screenshot
3. Security or engineering controls table
4. What this proves for the target role
5. Architecture or workflow section
6. How to run locally
7. How to run tests
8. Repo hygiene or safety notes
9. Documentation links
10. License

Do not overstate. Every claim should be backed by code, tests, docs, or a screenshot.

For test counts:

```bash
python -m pytest --collect-only -q
```

Only mention the count if it matches current collection. Prefer wording like:

```text
Current collection: 104 pytest tests.
```

If the run has skips, state the result exactly:

```text
103 passed, 1 skipped, 104 collected.
```

## Phase 5: Screenshots and Demo GIFs

Use one strong screenshot by default. Add a short demo GIF only when motion makes the project easier to understand.

Codex can usually add screenshots when:

- the app runs locally
- a live demo URL is available
- an existing screenshot or browser capture script exists
- the project is static HTML or a frontend app that can be opened locally

Codex can sometimes add demo GIFs when:

- the workflow can be reproduced in a browser or terminal
- the project has deterministic demo data
- local screen recording or frame capture tools are available
- the GIF will be short, focused, and not too large for the repository

Do not block a portfolio polish pass on a GIF. A clean screenshot is enough for most projects.

Preferred location:

```text
docs/screenshots/
```

Recommended naming:

```text
docs/screenshots/project-dashboard.png
docs/screenshots/project-demo.png
docs/screenshots/project-workflow.png
docs/screenshots/project-demo.gif
```

Add the screenshot to the README near the top:

```markdown
![Project dashboard](docs/screenshots/project-dashboard.png)
```

Add a GIF only when it is useful and small:

```markdown
![Project demo workflow](docs/screenshots/project-demo.gif)
```

Screenshot quality checklist:

- shows the actual product, dashboard, workflow, CLI output, or result
- avoids fake marketing visuals
- contains no secrets, private emails, student IDs, API keys, or client-private data
- is readable at GitHub README width
- has descriptive alt text
- is stored in the repo, not only linked from a private local path

Demo GIF quality checklist:

- 5 to 15 seconds
- one clear workflow only
- no secrets or private data
- not visually noisy
- reasonable file size for GitHub
- screenshot remains available as a fallback

For sensitive systems, a public live demo is not required. A local demo with screenshots and tests is usually safer.

## Phase 6: Repo Hygiene

Check tracked files:

```bash
git ls-files | rg -n '(^|/)(\.env|instance/|logs?/|audit.*log|.*\.log$|.*\.db$|.*\.sqlite$|.*\.sqlite3$|.*lock$|package-lock\.json|poetry\.lock|Pipfile\.lock|pdm\.lock)$' || true
```

Check ignored local artifacts:

```bash
git status --short --ignored
```

Common `.gitignore` entries:

```gitignore
.env
.env.*
!.env.example

instance/
logs/
*.log
audit.log
audit-*.log
audit_logs/

*.db
*.db-journal
*.db-shm
*.db-wal
*.sqlite
*.sqlite-journal
*.sqlite-shm
*.sqlite-wal
*.sqlite3
*.sqlite3-journal
*.sqlite3-shm
*.sqlite3-wal

.venv/
venv/
__pycache__/
.pytest_cache/
htmlcov/
.coverage

*.lock
Pipfile.lock
poetry.lock
pdm.lock
package-lock.json
npm-shrinkwrap.json
yarn.lock
pnpm-lock.yaml
```

Do not ignore lock files blindly if the project intentionally uses them for reproducible application builds. For portfolio cleanup, only ignore lock files when they are local clutter or not part of the project standard.

## Phase 7: Secret Scan

Run a targeted high-risk pattern scan before committing:

```bash
git grep -n -I -E '(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----)' -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.webp' || true
```

If anything matches:

- do not paste the secret into chat
- remove it from tracked files
- rotate it if it may have been pushed
- document only the remediation, not the value

## Phase 8: Verification

Use the project-native commands.

Python:

```bash
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt
python -m pytest
```

Node:

```bash
npm install
npm run lint
npm run test
npm run build
```

Vite or frontend app:

```bash
npm run build
npm run preview
```

Docker:

```bash
docker compose config
docker compose up --build
```

Always run:

```bash
git diff --check
```

If verification cannot run, record the exact blocker and command attempted.

## Phase 9: Local Commit

Check scope:

```bash
git status --short --branch
git diff --stat
git diff --check
```

If on `main`, create a branch:

```bash
git switch -c codex/project-polish
```

Stage only intended files:

```bash
git add README.md .gitignore docs/screenshots/
```

Commit:

```bash
git commit -m "Polish project security evidence"
```

Use a specific commit message for the project, for example:

```text
Polish SecureVote security evidence
Polish phishing detector portfolio docs
Polish CryptoToolkit verification docs
```

## Phase 10: Push and PR

Push the branch:

```bash
git push -u origin "$(git branch --show-current)"
```

If WSL Git lacks credentials but Windows Git has them:

```bash
"/mnt/c/Program Files/Git/cmd/git.exe" push -u origin "$(git branch --show-current)"
```

Open a draft PR.

PR title:

```text
[codex] Polish project security evidence
```

PR body template:

```markdown
## Summary
- Reworked the README to lead with recruiter-facing engineering evidence.
- Added or updated screenshot or demo media under `docs/screenshots/`.
- Updated GitHub description, homepage, and topics where needed.
- Added or clarified local demo and test verification steps.
- Tightened repo hygiene ignores for local runtime artifacts.

## Audit and Validation
- Reviewed the complete diff before staging.
- Verified README evidence paths exist locally.
- Checked for tracked `.env`, local DBs, logs, audit logs, `instance/`, and lock files.
- Ran a targeted high-risk secret pattern scan.
- Ran `git diff --check`.
- Ran `[exact test/build command]`: `[exact result]`.

## GitHub Metadata
- Description: `[current description]`
- Homepage: `[current homepage or none]`
- Topics: `[topic list]`

## Notes
- State any skipped tests, missing credentials, or known existing upstream alerts.
```

## Phase 11: PR Review and Merge

Before merging:

- PR is not draft
- branch is up to date or mergeable
- changed files match intended scope
- comments and reviews are resolved
- CI checks passed
- test result in PR body matches the latest run
- merge uses expected head SHA if available

Commands and checks:

```bash
git status --short --branch
git log --oneline --decorate -5
```

After merge, sync local main:

```bash
git switch main
git pull --ff-only
git status --short --branch
```

Delete the local feature branch only after confirming it is merged:

```bash
git branch --merged main
git branch -d codex/project-polish
```

## Definition of Done

A project is done when:

- README clearly explains value, evidence, setup, and verification
- screenshots are stored in `docs/screenshots/` if useful
- test or build command is documented and has been run
- test count is current, if mentioned
- no tracked secrets or local runtime artifacts are present
- `.gitignore` protects common local artifacts
- PR is merged into the default branch
- local checkout is synced to the merged default branch

## Portfolio Evidence Freshness

After a public project or release changes, update `evidence-registry.json` only
after reviewing the new default-branch commit and the portfolio claims it affects.
Then run:

```bash
node --test tests/evidence_freshness.test.js
node tools/check_evidence_freshness.js
bash tools/sync_public.sh
node tools/check_page.js
```

The checker validates public project, repository, release, package, policy, and
artifact links; compares reviewed commit references where determinable; identifies
missing policy surfaces; and requires explicit disclosures for unsigned,
checksum-only, or attested-but-not-code-signed artifacts. Treat errors as release
blockers. Review warnings rather than changing commit references mechanically.
Scheduled checks fail on stale commit references, broken links, missing required
policies, expired waivers, and other unwaived warnings. A time-bounded accepted
risk remains visible in the report and must name an owner, reason, acceptance
date, and expiry date.
The registry review and artifact manifest have 45-day maximum ages. Signed or
attested states require a public verification-evidence link, while unsigned
states require an explicit boundary disclosure. Live URLs are constrained to
the checker's approved hostname allowlist and redirects are revalidated.

Evidence reports may include only public URLs, HTTP status classes, and public
commit prefixes. Never include response bodies, headers, cookies, credentials,
tokens, private repository data, or URL query strings.

## Project Rollout Order

Suggested order for Meidie's portfolio:

1. SecureVote
2. Automated Phishing Detection
3. CryptoToolkit
4. AES Secure Vault
5. Cyber Command Center
6. Cloudflare DNS Action
7. Meidie Security Portfolio

For each project, repeat the workflow from Phase 1 and adapt the evidence table to the project domain.
