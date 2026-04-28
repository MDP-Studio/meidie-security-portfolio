# Meidie Fei

Cyber Security Analyst | Secure Software | Detection Engineering | Application Security

Melbourne, Australia
Email: meidie@mdpstudio.com.au | Portfolio: [meidie.mdpstudio.com.au](https://meidie.mdpstudio.com.au) | GitHub: [github.com/meidielo](https://github.com/meidielo)

## Summary

Early-career cybersecurity practitioner completing a Master of Cyber Security at RMIT University, with a Computer Science background and hands-on work across secure software, phishing detection, cryptography, vulnerability assessment, and cloud-backed web applications. Strong fit for security analyst, SOC, junior penetration testing, application security, and risk roles that need practical investigation, clear reporting, and collaboration with engineering teams.

## Core Skills

- Security: OWASP Top 10, web application security, vulnerability assessment, penetration testing labs, threat modeling, secure code review, remediation tracking
- Detection: phishing analysis, SPF/DKIM/DMARC review, IOC extraction, STIX 2.1 export, URL reputation, domain intelligence, sandboxing concepts
- Secure engineering: authentication, RBAC, CSRF protection, MFA, rate limiting, security headers, WAF rules, audit logging, encryption at rest, key management
- Tools: Python, JavaScript, TypeScript, SQL, Flask, FastAPI, SQLAlchemy, React, Docker, GitHub Actions, Supabase, Netlify, Cloudflare, HashiCorp Vault, Playwright, pytest, Vitest
- Communication: security documentation, test reports, technical teaching, stakeholder explanation, English and Indonesian

## Education

**RMIT University** - Master of Cyber Security
2025 - 2027 expected

Program GPA 3.3. Transcript highlights: HD in Ethical Hacking and Security Testing, Secure Software Systems, Practical Data Science with Python, and Data Communications; DI in Digital Risk Management in Information Security, Security in Computing and IT, and Introduction to Cyber Security.

**BINUS University** - Bachelor of Computer Science
Completed

## Security Projects

**SecureVote - Secure Electronic Voting Platform**
Flask, SQLAlchemy, MySQL, Docker, HashiCorp Vault, ModSecurity CRS, pytest
[GitHub](https://github.com/meidielo/secure-voting-platform)

- Built a secure online voting platform using RSA blind signatures, ChaCha20-Poly1305 PII encryption, HMAC-SHA256 blind indexing, HMAC-backed audit logs, RBAC, CSRF protection, MFA, rate limiting, ModSecurity CRS, and Vault Transit result signing.
- Implemented production safety gates, environment detection, security headers, WAF integration, split database connection patterns, and GitHub Actions security test documentation.
- Verified behavior with 103 pytest tests, including blind signature protocol tests, password policy tests, PII encryption and access tests, pagination limit tests, and 10-thread voting concurrency tests.

**PhishAnalyze - Automated Phishing Detection Pipeline**
Python, FastAPI, asyncio, SQLAlchemy, Playwright, threat intelligence APIs
[Live Demo](https://phishanalyze.mdpstudio.com.au/) | [GitHub](https://github.com/meidielo/Automated-Phishing-Detection)

- Built a 5-stage async pipeline for email ingestion, feature extraction, concurrent analysis, weighted decision scoring, and analyst feedback.
- Implemented analyzer coverage for header authentication, URL reputation, domain intelligence, URL detonation, brand impersonation, attachment handling, QR decoding, and NLP intent classification.
- Supported SPF/DKIM/DMARC checks, MIME parsing, URL extraction and defanging, STIX 2.1 IOC export, JSON/HTML reporting, and dashboard workflows.
- Tested against 22 synthetic brand email samples, achieving 90% recall, 91% precision, and F1 score of 0.90, with documented false positives and remediation ideas.

**CryptoToolkit - Interactive Cryptography and Attack Platform**
React, TypeScript, Vite, Web Crypto API, BigInt, Vitest
[Live Demo](https://ctool.mdpstudio.com.au) | [GitHub](https://github.com/meidielo/crypto-toolkit)

- Built 36 client-side cryptography modules covering cryptographic workflows, number theory, protocol composition, and real attack demonstrations.
- Implemented attacks including Bleichenbacher padding oracle, AES-CBC padding oracle, ECDSA nonce reuse, GCM nonce reuse, hash length extension, Wiener's attack, Hastad broadcast, CRT-RSA fault injection, textbook RSA malleability, and Diffie-Hellman small subgroup attacks.
- Added 95 tests using NIST and RFC test vectors, including AES, AES-GCM, SHA-256, HMAC-SHA256, and number theory edge cases.

**AES Secure Vault**
Python, cryptography, Argon2id, pytest, Hypothesis
[GitHub](https://github.com/meidielo/AES-256-GCM-Python-Tool) | [PyPI](https://pypi.org/project/aes-secure-vault/)

- Built a Python package and CLI implementing AES-256-GCM authenticated encryption with Argon2id key derivation, AAD binding, KDF downgrade prevention, and self-contained JSON envelope payloads.
- Wrote a threat model and tested roundtrip correctness, non-determinism, integrity failures, malformed payload rejection, KDF boundary enforcement, legacy payload support, and property-based fuzzing.

**Cloudflare DNS Action**
Node.js, TypeScript, GitHub Actions, Cloudflare API, Netlify API
[GitHub](https://github.com/MDP-Studio/cf-dns-action)

- Built an idempotent GitHub Action that attaches a Netlify custom domain and upserts a matching Cloudflare CNAME record, using scoped Cloudflare DNS tokens, dry-run mode, retry behavior, SSL provisioning checks, and CI validation.

**Cyber Command Center**
React, Supabase, Netlify
[Live Demo](https://c3.mdpstudio.com.au) | [GitHub](https://github.com/meidielo/cyber-command-center)

- Built a cybersecurity training tracker with guest mode, Supabase Auth, Row Level Security, Netlify deployment, and security headers.

## Security Coursework Highlights

- Ethical hacking: exploited and documented SQL injection login bypass, unsafe query construction leading to unauthorized data exposure, stored XSS, cookie theft, and XSS worm behavior in controlled lab environments.
- AI security and privacy: produced a membership inference threat model for an ML hiring-screen API. Reduced attack accuracy from 94.67% to 57.56% in the defended experiment using regularization, more training data, dropout, label smoothing, and fewer epochs.
- Cryptography and security in computing: implemented AES-CBC decryption, manual RSA, AES steganography, and hybrid RSA plus AES-GCM encryption tasks.

## Experience

**MDP Studio** - Co-Founder and Developer
Melbourne, Australia | 2026 - Present

- Co-founded a Melbourne web design and AI implementation studio serving small business clients.
- Built production web applications and automated lead-generation workflows using HTML/CSS/JavaScript, Python, Supabase, Netlify, Apify, and deployment automation.
- Implemented Supabase Row Level Security patterns, admin CMS workflows, HTTPS-backed Netlify deployments, security headers, and automated data pipelines for client-facing systems.

**Software Programming Instructor - KodeKiddo**
Indonesia

- Taught programming fundamentals to students aged 6-18, including Android development and Unity game development.
- Debugged student code in real time and translated technical concepts for non-technical learners.

**Data Assistant - BKPSDM**
Indonesia

- Reviewed, verified, and corrected employee data records in a government HR system.
- Built foundational experience in data integrity, consistency checking, and structured data governance.

## Availability

Open to security analyst, SOC analyst, junior penetration testing, application security, security engineering, technology assurance, and risk advisory roles.
