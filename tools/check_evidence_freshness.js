const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dns = require("dns");
const net = require("net");

const ALLOWED_POLICY_EXPECTATIONS = new Set(["required", "recommended", "not-applicable"]);
const ALLOWED_TRUST_STATES = new Set([
  "signed",
  "attested-not-code-signed",
  "unsigned-disclosed",
  "checksum-only-unsigned",
  "not-applicable",
]);
const UNSIGNED_TRUST_STATES = new Set([
  "attested-not-code-signed",
  "unsigned-disclosed",
  "checksum-only-unsigned",
]);
const VERIFICATION_REQUIRED_STATES = new Set(["signed", "attested-not-code-signed"]);
const APPROVED_LIVE_HOSTNAMES = new Set([
  "api.github.com",
  "c3.mdpstudio.com.au",
  "ctool.mdpstudio.com.au",
  "github.com",
  "meidie.mdpstudio.com.au",
  "payshield.mdpstudio.com.au",
  "phishanalyze.mdpstudio.com.au",
  "pypi.org",
  "rmmhunter.mdpstudio.com.au",
]);
const NON_PUBLIC_NETWORKS = new net.BlockList();
for (const [address, prefix, family] of [
  ["0.0.0.0", 8, "ipv4"],
  ["10.0.0.0", 8, "ipv4"],
  ["100.64.0.0", 10, "ipv4"],
  ["127.0.0.0", 8, "ipv4"],
  ["169.254.0.0", 16, "ipv4"],
  ["172.16.0.0", 12, "ipv4"],
  ["192.0.0.0", 24, "ipv4"],
  ["192.0.2.0", 24, "ipv4"],
  ["192.168.0.0", 16, "ipv4"],
  ["198.18.0.0", 15, "ipv4"],
  ["198.51.100.0", 24, "ipv4"],
  ["203.0.113.0", 24, "ipv4"],
  ["224.0.0.0", 4, "ipv4"],
  ["240.0.0.0", 4, "ipv4"],
  ["::", 128, "ipv6"],
  ["::1", 128, "ipv6"],
  ["100::", 64, "ipv6"],
  ["2001:db8::", 32, "ipv6"],
  ["fc00::", 7, "ipv6"],
  ["fe80::", 10, "ipv6"],
  ["ff00::", 8, "ipv6"],
]) {
  NON_PUBLIC_NETWORKS.addSubnet(address, prefix, family);
}

function normalizeHostname(hostname) {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function isPublicNetworkAddress(address) {
  let normalized = normalizeHostname(address);
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) normalized = mapped[1];
  const family = net.isIP(normalized);
  if (!family) return false;
  return !NON_PUBLIC_NETWORKS.check(normalized, family === 4 ? "ipv4" : "ipv6");
}

function isAllowedPublicHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  if (
    normalized === "localhost"
    || [".localhost", ".local", ".internal", ".home", ".lan", ".onion"].some((suffix) => normalized.endsWith(suffix))
  ) return false;
  return net.isIP(normalized) ? isPublicNetworkAddress(normalized) : Boolean(normalized);
}

function sanitizeUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !URL.canParse(rawUrl)) return "[invalid URL]";
  const parsed = new URL(rawUrl);
  parsed.username = "";
  parsed.password = "";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function isPublicHttpsUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !URL.canParse(rawUrl)) return false;
  const parsed = new URL(rawUrl);
  return parsed.protocol === "https:"
    && !parsed.username
    && !parsed.password
    && (!parsed.port || parsed.port === "443")
    && isAllowedPublicHostname(parsed.hostname);
}

function githubCoordinates(repositoryUrl) {
  if (typeof repositoryUrl !== "string" || !URL.canParse(repositoryUrl)) return null;
  const parsed = new URL(repositoryUrl);
  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parsed.hostname !== "github.com" || parts.length !== 2) {
    return null;
  }
  return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
}

function finding(severity, project, check, message, url = null) {
  return {
    severity,
    project,
    check,
    message: String(message).replace(/[\r\n]+/g, " ").slice(0, 500),
    ...(url ? { url: sanitizeUrl(url) } : {}),
  };
}

function parseRegistryDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T23:59:59.999Z`);
  if (Number.isNaN(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp;
}

function parseRegistryDateStart(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp;
}

function validateReviewWindow(value, maxAgeDays, checkedAt, project, check, label) {
  const issues = [];
  const timestamp = typeof value === "string" ? Date.parse(value) : Number.NaN;
  const checkedAtTimestamp = Date.parse(checkedAt);
  if (!Number.isFinite(timestamp) || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    issues.push(finding("error", project, check, `${label} must be a valid ISO-8601 timestamp.`));
  }
  if (!Number.isInteger(maxAgeDays) || maxAgeDays < 1 || maxAgeDays > 365) {
    issues.push(finding("error", project, check, `${label} max-age must be an integer from 1 to 365 days.`));
  }
  if (issues.length || !Number.isFinite(checkedAtTimestamp)) return issues;
  if (timestamp > checkedAtTimestamp + 5 * 60 * 1000) {
    issues.push(finding("error", project, check, `${label} is in the future relative to this check.`));
  } else if (checkedAtTimestamp - timestamp > maxAgeDays * 24 * 60 * 60 * 1000) {
    issues.push(finding("error", project, check, `${label} is older than its ${maxAgeDays}-day review window.`));
  }
  return issues;
}

function validateRegistry(registry, checkedAt = new Date().toISOString()) {
  const findings = [];
  if (registry.schemaVersion !== "meidie-security-portfolio.evidence-registry.v1") {
    findings.push(finding("error", "registry", "schema", "Evidence registry schemaVersion is missing or unsupported."));
  }
  if (!Array.isArray(registry.projects) || registry.projects.length === 0) {
    findings.push(finding("error", "registry", "schema", "Evidence registry must contain at least one project."));
    return findings;
  }
  findings.push(...validateReviewWindow(
    registry.lastReviewedAt,
    registry.reviewMaxAgeDays,
    checkedAt,
    "registry",
    "review-age",
    "Evidence registry review",
  ));

  const ids = new Set();
  for (const project of registry.projects) {
    const projectId = project.id || "[missing id]";
    if (!project.id || !project.name) {
      findings.push(finding("error", projectId, "schema", "Project id and name are required."));
    }
    if (ids.has(project.id)) {
      findings.push(finding("error", projectId, "schema", "Project id must be unique."));
    }
    ids.add(project.id);

    if (!isPublicHttpsUrl(project.repository) || !githubCoordinates(project.repository)) {
      findings.push(finding("error", projectId, "repository", "Repository must be a public HTTPS GitHub URL.", project.repository));
    }
    if (!project.defaultBranch) {
      findings.push(finding("error", projectId, "commit", "defaultBranch is required for commit freshness checks."));
    }
    if (project.evidenceCommit && !/^[0-9a-f]{40}$/i.test(project.evidenceCommit)) {
      findings.push(finding("error", projectId, "commit", "evidenceCommit must be a full 40-character Git commit SHA."));
    }
    if (!Array.isArray(project.surfaces) || project.surfaces.length === 0) {
      findings.push(finding("error", projectId, "links", "At least one public evidence surface is required."));
    } else {
      for (const surface of project.surfaces) {
        if (!surface.kind || !surface.label || !isPublicHttpsUrl(surface.url)) {
          findings.push(finding("error", projectId, "links", "Every surface needs kind, label, and a public HTTPS URL.", surface.url));
        }
        if (
          surface.expectedContent !== undefined
          && (typeof surface.expectedContent !== "string" || surface.expectedContent.length < 1 || surface.expectedContent.length > 200)
        ) {
          findings.push(finding("error", projectId, "links", "An expectedContent marker must contain 1 to 200 characters."));
        }
      }
    }

    const policy = project.securityPolicy || {};
    if (!ALLOWED_POLICY_EXPECTATIONS.has(policy.expectation)) {
      findings.push(finding("error", projectId, "security-policy", "securityPolicy.expectation is invalid."));
    }
    if (policy.url && !isPublicHttpsUrl(policy.url)) {
      findings.push(finding("error", projectId, "security-policy", "Security policy URL must use public HTTPS.", policy.url));
    }
    if (policy.expectation === "not-applicable" && !policy.reason) {
      findings.push(finding("error", projectId, "security-policy", "A not-applicable security policy needs a reason."));
    }
    if (policy.waiver) {
      const acceptedAt = parseRegistryDateStart(policy.waiver.acceptedAt);
      const expiresAt = parseRegistryDate(policy.waiver.expiresAt);
      if (policy.expectation !== "recommended") {
        findings.push(finding("error", projectId, "security-policy", "A policy waiver is allowed only for a recommended policy."));
      }
      if (!policy.waiver.reason || !policy.waiver.owner || !acceptedAt || !expiresAt || expiresAt < acceptedAt) {
        findings.push(finding("error", projectId, "security-policy", "A policy waiver needs an owner, reason, and valid acceptedAt/expiresAt dates."));
      }
      if (acceptedAt && acceptedAt > Date.parse(checkedAt)) {
        findings.push(finding("error", projectId, "security-policy", "A policy waiver cannot be accepted after the evidence check time."));
      }
    }

    const trust = project.artifactTrust || {};
    if (!ALLOWED_TRUST_STATES.has(trust.status)) {
      findings.push(finding("error", projectId, "artifact-trust", "artifactTrust.status is missing or invalid."));
    }
    if (UNSIGNED_TRUST_STATES.has(trust.status)) {
      if (!isPublicHttpsUrl(trust.disclosureUrl) || !trust.disclosureText) {
        findings.push(finding("error", projectId, "artifact-trust", "Unsigned or non-code-signed artifacts need a public disclosure URL and disclosure text."));
      }
    }
    if (VERIFICATION_REQUIRED_STATES.has(trust.status) && !isPublicHttpsUrl(trust.verificationUrl)) {
      findings.push(finding("error", projectId, "artifact-trust", "Signed or attested status needs a public verification evidence URL.", trust.verificationUrl));
    }
    if (trust.status === "signed" && !trust.signerIdentity) {
      findings.push(finding("error", projectId, "artifact-trust", "A signed artifact status needs a public signer identity."));
    }
    if (trust.status === "not-applicable" && !trust.reason) {
      findings.push(finding("error", projectId, "artifact-trust", "A not-applicable artifact trust state needs a reason."));
    }
  }
  return findings;
}

function validateArtifactManifest(manifest, rootDir, disclosureCopy, checkedAt = new Date().toISOString()) {
  const findings = [];
  if (manifest.schemaVersion !== "meidie-security-portfolio.artifact-manifest.v1") {
    findings.push(finding("error", "portfolio-artifacts", "schema", "Artifact manifest schemaVersion is missing or unsupported."));
  }
  if (!Array.isArray(manifest.artifacts)) {
    findings.push(finding("error", "portfolio-artifacts", "schema", "Artifact manifest must contain an artifacts array."));
    return findings;
  }
  findings.push(...validateReviewWindow(
    manifest.generatedAt,
    manifest.maxAgeDays,
    checkedAt,
    "portfolio-artifacts",
    "review-age",
    "Artifact manifest generation",
  ));

  for (const artifact of manifest.artifacts) {
    const artifactId = artifact.id || "[missing artifact id]";
    if (!artifact.id || !artifact.name || !isPublicHttpsUrl(artifact.url)) {
      findings.push(finding("error", "portfolio-artifacts", "schema", `Artifact ${artifactId} needs id, name, and a public HTTPS URL.`, artifact.url));
    }
    if (!ALLOWED_TRUST_STATES.has(artifact.signingStatus)) {
      findings.push(finding("error", "portfolio-artifacts", "artifact-trust", `Artifact ${artifactId} needs an explicit signingStatus.`));
    }
    if (UNSIGNED_TRUST_STATES.has(artifact.signingStatus)) {
      if (!artifact.disclosure || !isPublicHttpsUrl(artifact.disclosureUrl)) {
        findings.push(finding("error", "portfolio-artifacts", "artifact-trust", `Artifact ${artifactId} needs an unsigned or non-code-signed disclosure.`));
      } else if (!disclosureCopy.includes(artifact.disclosure)) {
        findings.push(finding("error", "portfolio-artifacts", "artifact-trust", `Artifact ${artifactId} disclosure is not present in the public source copy.`));
      }
    }
    if (VERIFICATION_REQUIRED_STATES.has(artifact.signingStatus) && !isPublicHttpsUrl(artifact.verificationUrl)) {
      findings.push(finding("error", "portfolio-artifacts", "artifact-trust", `Artifact ${artifactId} needs a public verification evidence URL.`));
    }
    if (artifact.signingStatus === "signed" && !artifact.signerIdentity) {
      findings.push(finding("error", "portfolio-artifacts", "artifact-trust", `Artifact ${artifactId} needs a signer identity.`));
    }
    if (artifact.path) {
      const localPath = path.resolve(rootDir, artifact.path);
      if (!localPath.startsWith(path.resolve(rootDir) + path.sep) || !fs.existsSync(localPath)) {
        findings.push(finding("error", "portfolio-artifacts", "local-artifact", `Artifact ${artifactId} local path is missing or outside the repository.`));
      } else if (artifact.sha256) {
        const actualHash = crypto.createHash("sha256").update(fs.readFileSync(localPath)).digest("hex").toUpperCase();
        if (actualHash !== artifact.sha256.toUpperCase()) {
          findings.push(finding("error", "portfolio-artifacts", "local-artifact", `Artifact ${artifactId} SHA-256 does not match the local file.`));
        }
      }
    }
  }
  return findings;
}

async function assertPublicDestination(rawUrl, resolveHostname) {
  if (!isPublicHttpsUrl(rawUrl)) {
    const error = new Error("Only public HTTPS destinations on the standard port are allowed.");
    error.name = "UnsafeUrlError";
    throw error;
  }
  const hostname = normalizeHostname(new URL(rawUrl).hostname);
  // The fixed host allowlist limits attacker-controlled destinations. The
  // connection still relies on public DNS and is not advertised as DNS-pinned.
  if (!APPROVED_LIVE_HOSTNAMES.has(hostname)) {
    const error = new Error("Destination hostname is not in the evidence allowlist.");
    error.name = "UnsafeUrlError";
    throw error;
  }
  if (net.isIP(hostname)) return;
  const addresses = await resolveHostname(hostname, { all: true, verbatim: true });
  if (!Array.isArray(addresses) || addresses.length === 0 || addresses.some(({ address }) => !isPublicNetworkAddress(address))) {
    const error = new Error("Destination DNS includes a non-public address.");
    error.name = "UnsafeUrlError";
    throw error;
  }
}

async function readBoundedText(response, maxBytes = 1024 * 1024) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        const error = new Error("Public marker response exceeded the read limit.");
        error.name = "ResponseTooLargeError";
        throw error;
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks).toString("utf8");
}

function createLiveRequester({
  token = "",
  timeoutMs = 15000,
  maxRedirects = 5,
  fetchImpl = globalThis.fetch,
  resolveHostname = dns.promises.lookup,
} = {}) {
  return async function request(url, { json = false, text = false } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let currentUrl = url;
      for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
        await assertPublicDestination(currentUrl, resolveHostname);
        const currentHostname = normalizeHostname(new URL(currentUrl).hostname);
        const headers = {
          Accept: json ? "application/vnd.github+json" : "*/*",
          "User-Agent": "meidie-security-portfolio-evidence-check/1.0",
        };
        if (token && currentHostname === "api.github.com") {
          headers.Authorization = `Bearer ${token}`;
          headers["X-GitHub-Api-Version"] = "2022-11-28";
        }
        const response = await fetchImpl(currentUrl, {
          method: "GET",
          redirect: "manual",
          headers,
          signal: controller.signal,
        });
        if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
          if (response.body) await response.body.cancel();
          if (redirectCount === maxRedirects) {
            const error = new Error("Redirect limit exceeded.");
            error.name = "RedirectLimitError";
            throw error;
          }
          currentUrl = new URL(response.headers.get("location"), currentUrl).toString();
          continue;
        }
        let body = null;
        if (json) {
          try {
            body = await response.json();
          } catch (error) {
            error.name = "ResponseJsonError";
            throw error;
          }
        } else if (text) {
          body = await readBoundedText(response);
        } else if (response.body) {
          await response.body.cancel();
        }
        return { status: response.status, body, finalUrl: currentUrl };
      }
      throw new Error("Redirect processing failed.");
    } finally {
      clearTimeout(timer);
    }
  };
}

function createFixtureRequester(fixture) {
  return async function request(url) {
    if (!Object.prototype.hasOwnProperty.call(fixture.responses, url)) {
      const error = new Error("Fixture response missing");
      error.name = "FixtureMissingError";
      throw error;
    }
    return structuredClone(fixture.responses[url]);
  };
}

async function safeRequest(request, url, options = {}) {
  if (!isPublicHttpsUrl(url)) {
    return {
      status: 0,
      body: null,
      finalUrl: sanitizeUrl(url),
      errorType: "UnsafeUrlError",
    };
  }
  const outcome = await Promise.resolve()
    .then(() => request(url, options))
    .then(
      (response) => ({ response, error: null }),
      (error) => ({ response: null, error }),
    );
  if (outcome.error) {
    return {
      status: 0,
      body: null,
      finalUrl: sanitizeUrl(url),
      errorType: outcome.error && outcome.error.name ? outcome.error.name : "RequestError",
    };
  }
  const response = outcome.response;
  if (response.finalUrl && !isPublicHttpsUrl(response.finalUrl)) {
    return {
      status: 0,
      body: null,
      finalUrl: sanitizeUrl(response.finalUrl),
      errorType: "UnsafeUrlError",
    };
  }
  return {
    status: Number(response.status) || 0,
    body: response.body || null,
    finalUrl: response.finalUrl ? sanitizeUrl(response.finalUrl) : sanitizeUrl(url),
  };
}

function classifyLinkResponse(projectId, label, url, response) {
  if (response.status >= 200 && response.status < 300) {
    return null;
  }
  if ([401, 403, 429].includes(response.status)) {
    return finding("warning", projectId, "link", `${label} could not be independently validated (HTTP ${response.status}).`, url);
  }
  if (response.status === 0) {
    return finding("error", projectId, "link", `${label} request failed (${response.errorType}).`, url);
  }
  return finding("error", projectId, "link", `${label} returned HTTP ${response.status}.`, url);
}

async function auditProject(project, request, disclosureCopy, checkedAt) {
  const findings = [];
  const links = new Map();
  links.set(project.repository, { label: "Repository", expectedContent: null });
  for (const surface of project.surfaces || []) {
    links.set(surface.url, { label: surface.label, expectedContent: surface.expectedContent || null });
  }
  if (project.securityPolicy && project.securityPolicy.url) {
    links.set(project.securityPolicy.url, { label: "Security policy", expectedContent: null });
  }
  if (project.artifactTrust && project.artifactTrust.disclosureUrl) {
    links.set(project.artifactTrust.disclosureUrl, { label: "Artifact trust disclosure", expectedContent: null });
  }
  if (project.artifactTrust && project.artifactTrust.verificationUrl) {
    links.set(project.artifactTrust.verificationUrl, { label: "Signing or attestation verification evidence", expectedContent: null });
  }

  let linksPassed = 0;
  const linkResults = await Promise.all(
    [...links.entries()].map(async ([url, link]) => ({
      url,
      ...link,
      response: await safeRequest(request, url, { text: Boolean(link.expectedContent) }),
    })),
  );
  for (const result of linkResults) {
    let issue = classifyLinkResponse(project.id, result.label, result.url, result.response);
    if (!issue && result.expectedContent && !String(result.response.body || "").includes(result.expectedContent)) {
      issue = finding("error", project.id, "link-content", `${result.label} did not contain its configured public marker.`, result.url);
    }
    if (issue) {
      findings.push(issue);
    } else {
      linksPassed += 1;
    }
  }

  const coordinates = githubCoordinates(project.repository);
  let currentCommit = null;
  if (coordinates && project.defaultBranch) {
    const commitUrl = `https://api.github.com/repos/${coordinates.owner}/${coordinates.repo}/commits/${encodeURIComponent(project.defaultBranch)}`;
    const response = await safeRequest(request, commitUrl, { json: true });
    if (response.status === 200 && response.body && /^[0-9a-f]{40}$/i.test(response.body.sha || "")) {
      currentCommit = response.body.sha.toLowerCase();
      if (project.evidenceCommit && currentCommit !== project.evidenceCommit.toLowerCase()) {
        findings.push(finding(
          "error",
          project.id,
          "commit",
          `Portfolio evidence references ${project.evidenceCommit.slice(0, 12)}, while ${project.defaultBranch} is now ${currentCommit.slice(0, 12)}. Review claims before refreshing the reference.`,
          project.repository,
        ));
      }
    } else {
      findings.push(finding("warning", project.id, "commit", `Could not determine the current ${project.defaultBranch} commit (HTTP ${response.status || "request failure"}).`, project.repository));
    }
  }

  let policyState = "not-applicable";
  const policy = project.securityPolicy || {};
  if (coordinates && policy.expectation !== "not-applicable") {
    policyState = "missing";
    let policyIndeterminate = null;
    for (const policyPath of ["SECURITY.md", ".github/SECURITY.md", "docs/SECURITY.md"]) {
      const policyApiUrl = `https://api.github.com/repos/${coordinates.owner}/${coordinates.repo}/contents/${policyPath}`;
      const response = await safeRequest(request, policyApiUrl, { json: true });
      if (response.status === 200) {
        policyState = "present";
        break;
      }
      if (response.status !== 404) {
        policyIndeterminate = response;
        break;
      }
    }
    if (policyState === "missing" && policyIndeterminate) {
      policyState = "indeterminate";
      findings.push(finding(
        "warning",
        project.id,
        "security-policy",
        `Could not conclusively check SECURITY.md locations (HTTP ${policyIndeterminate.status || "request failure"}).`,
        project.repository,
      ));
    } else if (policyState === "missing") {
      const severity = policy.expectation === "required" ? "error" : "warning";
      const waiver = policy.waiver;
      const acceptedAt = waiver && parseRegistryDateStart(waiver.acceptedAt);
      const expiresAt = waiver && parseRegistryDate(waiver.expiresAt);
      const checkedAtTimestamp = Date.parse(checkedAt);
      if (
        severity === "warning"
        && waiver
        && acceptedAt
        && expiresAt
        && checkedAtTimestamp >= acceptedAt
        && checkedAtTimestamp <= expiresAt
      ) {
        policyState = `missing, accepted risk until ${waiver.expiresAt}`;
        const issue = finding(
          "warning",
          project.id,
          "security-policy",
          `No SECURITY.md policy was found (recommended). Accepted risk owned by ${waiver.owner} until ${waiver.expiresAt}: ${waiver.reason}`,
          project.repository,
        );
        issue.waivedUntil = waiver.expiresAt;
        findings.push(issue);
      } else if (severity === "warning" && waiver && expiresAt && checkedAtTimestamp > expiresAt) {
        policyState = `missing, waiver expired ${waiver.expiresAt}`;
        findings.push(finding(
          "error",
          project.id,
          "security-policy",
          `The accepted-risk waiver for the missing recommended SECURITY.md expired on ${waiver.expiresAt}. Review or remediate the gap.`,
          project.repository,
        ));
      } else {
        findings.push(finding(severity, project.id, "security-policy", `No SECURITY.md policy was found in the root, .github, or docs path (${policy.expectation}).`, project.repository));
      }
    }
  }

  const trust = project.artifactTrust || {};
  if (UNSIGNED_TRUST_STATES.has(trust.status) && trust.disclosureText && !disclosureCopy.includes(trust.disclosureText)) {
    findings.push(finding("error", project.id, "artifact-trust", "The configured unsigned or non-code-signed disclosure is missing from the public source copy.", trust.disclosureUrl));
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      linksChecked: links.size,
      linksPassed,
      evidenceCommit: project.evidenceCommit || null,
      currentCommit,
      policyState,
      artifactTrust: trust.status || "unknown",
    },
    findings,
  };
}

async function auditArtifactLinks(manifest, request) {
  const findings = [];
  let linksChecked = 0;
  let linksPassed = 0;
  const links = new Map();
  for (const artifact of manifest.artifacts || []) {
    if (artifact.url) links.set(artifact.url, artifact.name || artifact.id);
    if (artifact.disclosureUrl) links.set(artifact.disclosureUrl, `${artifact.name || artifact.id} disclosure`);
    if (artifact.verificationUrl) links.set(artifact.verificationUrl, `${artifact.name || artifact.id} verification evidence`);
  }
  linksChecked = links.size;
  const results = await Promise.all(
    [...links.entries()].map(async ([url, label]) => ({ url, label, response: await safeRequest(request, url) })),
  );
  for (const result of results) {
    const issue = classifyLinkResponse("portfolio-artifacts", result.label, result.url, result.response);
    if (issue) findings.push(issue);
    else linksPassed += 1;
  }
  return {
    project: {
      id: "portfolio-artifacts",
      name: "Portfolio artifacts",
      linksChecked,
      linksPassed,
      evidenceCommit: null,
      currentCommit: null,
      policyState: "not-applicable",
      artifactTrust: "manifest",
    },
    findings,
  };
}

function countSeverities(findings) {
  return findings.reduce((counts, item) => {
    counts[item.severity] += 1;
    if (item.severity === "warning" && item.waivedUntil) counts.waivedWarning += 1;
    if (item.severity === "warning" && !item.waivedUntil) counts.actionableWarning += 1;
    return counts;
  }, { error: 0, warning: 0, info: 0, waivedWarning: 0, actionableWarning: 0 });
}

function buildMarkdown(report) {
  const lines = [
    "# Portfolio Evidence Freshness Report",
    "",
    `- Checked at: ${report.checkedAt}`,
    `- Mode: ${report.mode}`,
    `- Projects and artifact groups: ${report.projects.length}`,
    `- Findings: ${report.summary.error} errors, ${report.summary.warning} warnings (${report.summary.waivedWarning} accepted risk, ${report.summary.actionableWarning} actionable)`,
    "",
    "Reports include only public URLs, HTTP status classes, and commit prefixes. Response bodies, headers, credentials, tokens, and URL query strings are never included.",
    "",
    "## Coverage",
    "",
    "| Project | Links | Commit reference | Security policy | Artifact trust |",
    "| --- | ---: | --- | --- | --- |",
  ];

  for (const project of report.projects) {
    let commit = "not tracked";
    if (project.evidenceCommit && project.currentCommit) {
      commit = project.evidenceCommit === project.currentCommit
        ? `current (${project.currentCommit.slice(0, 12)})`
        : `review ${project.evidenceCommit.slice(0, 12)} -> ${project.currentCommit.slice(0, 12)}`;
    } else if (project.currentCommit) {
      commit = `observed ${project.currentCommit.slice(0, 12)}`;
    }
    lines.push(`| ${project.name} | ${project.linksPassed}/${project.linksChecked} | ${commit} | ${project.policyState} | ${project.artifactTrust} |`);
  }

  lines.push("", "## Findings", "");
  if (report.findings.length === 0) {
    lines.push("No freshness findings were detected.");
  } else {
    lines.push("| Severity | Project | Check | Evidence |", "| --- | --- | --- | --- |");
    for (const item of report.findings) {
      const evidence = item.url ? `${item.message} (${item.url})` : item.message;
      const severity = item.waivedUntil ? `${item.severity.toUpperCase()} (accepted risk until ${item.waivedUntil})` : item.severity.toUpperCase();
      lines.push(`| ${severity} | ${item.project} | ${item.check} | ${evidence.replace(/\|/g, "\\|")} |`);
    }
  }

  lines.push(
    "",
    "## Interpretation",
    "",
    "- An error means a required public link, policy, manifest rule, local hash, or disclosure failed validation.",
    "- An actionable warning means an automated check was inconclusive or a non-required gap needs review.",
    "- An accepted-risk warning stays visible until its documented expiry date; an expired waiver becomes an error.",
    "- A clean report confirms only the configured public evidence surfaces at the check time. It does not certify project security.",
    "",
  );
  return lines.join("\n");
}

async function runAudit({ registry, artifactManifest, request, checkedAt, mode, rootDir, disclosureCopy }) {
  const findings = [
    ...validateRegistry(registry, checkedAt),
    ...validateArtifactManifest(artifactManifest, rootDir, disclosureCopy, checkedAt),
  ];
  const results = await Promise.all(
    registry.projects.map((project) => auditProject(project, request, disclosureCopy, checkedAt)),
  );
  results.push(await auditArtifactLinks(artifactManifest, request));

  const projects = [];
  for (const result of results) {
    projects.push(result.project);
    findings.push(...result.findings);
  }
  findings.sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity] || a.project.localeCompare(b.project) || a.check.localeCompare(b.check);
  });
  const report = {
    schemaVersion: "meidie-security-portfolio.evidence-report.v1",
    checkedAt,
    mode,
    summary: countSeverities(findings),
    projects,
    findings,
  };
  report.markdown = buildMarkdown(report);
  return report;
}

function parseArgs(argv) {
  const args = {
    registry: "evidence-registry.json",
    artifactManifest: "artifact-manifest.json",
    output: "reports/evidence-freshness.md",
    jsonOutput: "reports/evidence-freshness.json",
    fixture: null,
    failOnWarning: false,
    failOnUnwaivedWarning: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--fail-on-warning") args.failOnWarning = true;
    else if (arg === "--fail-on-unwaived-warning") args.failOnUnwaivedWarning = true;
    else if (arg === "--registry") args.registry = argv[++index];
    else if (arg === "--artifact-manifest") args.artifactManifest = argv[++index];
    else if (arg === "--output") args.output = argv[++index];
    else if (arg === "--json-output") args.jsonOutput = argv[++index];
    else if (arg === "--fixture") args.fixture = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const rootDir = process.cwd();
  const registry = JSON.parse(fs.readFileSync(path.resolve(rootDir, args.registry), "utf8"));
  const artifactManifest = JSON.parse(fs.readFileSync(path.resolve(rootDir, args.artifactManifest), "utf8"));
  const disclosureCopy = ["index.html", "security.html", "SECURITY.md"]
    .filter((file) => fs.existsSync(path.resolve(rootDir, file)))
    .map((file) => fs.readFileSync(path.resolve(rootDir, file), "utf8"))
    .join("\n");

  let mode = "live";
  let checkedAt = new Date().toISOString();
  let request = createLiveRequester({ token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "" });
  if (args.fixture) {
    const fixture = JSON.parse(fs.readFileSync(path.resolve(rootDir, args.fixture), "utf8"));
    mode = "offline-fixture";
    checkedAt = fixture.checkedAt;
    request = createFixtureRequester(fixture);
  }

  const report = await runAudit({
    registry,
    artifactManifest,
    request,
    checkedAt,
    mode,
    rootDir,
    disclosureCopy,
  });
  const outputPath = path.resolve(rootDir, args.output);
  const jsonOutputPath = path.resolve(rootDir, args.jsonOutput);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(path.dirname(jsonOutputPath), { recursive: true });
  fs.writeFileSync(outputPath, report.markdown, "utf8");
  const jsonReport = { ...report };
  delete jsonReport.markdown;
  fs.writeFileSync(jsonOutputPath, `${JSON.stringify(jsonReport, null, 2)}\n`, "utf8");

  console.log(`Evidence freshness: ${report.summary.error} errors, ${report.summary.warning} warnings`);
  console.log(`Markdown report: ${path.relative(rootDir, outputPath)}`);
  console.log(`JSON report: ${path.relative(rootDir, jsonOutputPath)}`);

  if (
    report.summary.error > 0
    || (args.failOnWarning && report.summary.warning > 0)
    || (args.failOnUnwaivedWarning && report.summary.actionableWarning > 0)
  ) {
    process.exitCode = 1;
  }
  return report;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Evidence freshness check failed (${error && error.name ? error.name : "Error"}).`);
    process.exitCode = 1;
  });
}

module.exports = {
  buildMarkdown,
  createFixtureRequester,
  createLiveRequester,
  githubCoordinates,
  runAudit,
  sanitizeUrl,
  validateArtifactManifest,
  validateRegistry,
};
