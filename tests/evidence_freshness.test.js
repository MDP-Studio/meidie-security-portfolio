const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const {
  buildMarkdown,
  createFixtureRequester,
  createLiveRequester,
  runAudit,
  sanitizeUrl,
  validateRegistry,
} = require("../tools/check_evidence_freshness.js");

const rootDir = path.resolve(__dirname, "..");
const fixtureDir = path.join(__dirname, "fixtures");

function readFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, name), "utf8"));
}

async function runFixture(overrides = {}) {
  const registry = overrides.registry || readFixture("evidence-registry.json");
  const artifactManifest = overrides.artifactManifest || readFixture("artifact-manifest.json");
  const fixture = overrides.fixture || readFixture("evidence-responses.json");
  return runAudit({
    registry,
    artifactManifest,
    request: createFixtureRequester(fixture),
    checkedAt: fixture.checkedAt,
    mode: "offline-fixture",
    rootDir,
    disclosureCopy: overrides.disclosureCopy || "Beta binaries are unsigned.",
  });
}

test("sanitizes credentials, query strings, and fragments from report URLs", () => {
  assert.equal(
    sanitizeUrl("https://user:password@example.com/path?token=secret#private"),
    "https://example.com/path",
  );
});

test("offline fixture fails stale commits and reports recommended missing policies", async () => {
  const report = await runFixture();

  assert.equal(report.summary.error, 1);
  assert.equal(report.summary.warning, 1);
  assert.equal(report.summary.actionableWarning, 1);
  assert.ok(report.findings.some(
    (item) => item.project === "stale-project" && item.check === "commit" && item.severity === "error",
  ));
  assert.ok(report.findings.some((item) => item.project === "stale-project" && item.check === "security-policy"));
});

test("active policy waiver remains visible without becoming actionable", async () => {
  const registry = readFixture("evidence-registry.json");
  registry.projects[1].securityPolicy.waiver = {
    owner: "Fixture maintainers",
    acceptedAt: "2026-07-01",
    expiresAt: "2026-07-31",
    reason: "Fixture scope defers the recommended policy until the next review.",
  };

  const report = await runFixture({ registry });
  const issue = report.findings.find(
    (item) => item.project === "stale-project" && item.check === "security-policy",
  );

  assert.equal(issue.severity, "warning");
  assert.equal(issue.waivedUntil, "2026-07-31");
  assert.equal(report.summary.waivedWarning, 1);
  assert.equal(report.summary.actionableWarning, 0);
  assert.match(report.markdown, /accepted risk until 2026-07-31/i);
});

test("expired policy waiver becomes an error", async () => {
  const registry = readFixture("evidence-registry.json");
  registry.projects[1].securityPolicy.waiver = {
    owner: "Fixture maintainers",
    acceptedAt: "2026-06-01",
    expiresAt: "2026-07-12",
    reason: "Fixture waiver intentionally expires before the check date.",
  };

  const report = await runFixture({ registry });

  assert.ok(report.findings.some(
    (item) => item.project === "stale-project"
      && item.check === "security-policy"
      && item.severity === "error"
      && /expired on 2026-07-12/.test(item.message),
  ));
});

test("future-dated policy waiver is rejected and does not waive the warning", async () => {
  const registry = readFixture("evidence-registry.json");
  registry.projects[1].securityPolicy.waiver = {
    owner: "Fixture maintainers",
    acceptedAt: "2026-07-14",
    expiresAt: "2026-07-31",
    reason: "This decision has not taken effect at the fixture check time.",
  };

  const report = await runFixture({ registry });
  const issue = report.findings.find(
    (item) => item.project === "stale-project" && item.check === "security-policy" && item.severity === "warning",
  );

  assert.equal(issue.waivedUntil, undefined);
  assert.ok(report.findings.some((item) => /cannot be accepted after/.test(item.message)));
});

test("rate-limited policy probes are indeterminate rather than missing", async () => {
  const fixture = readFixture("evidence-responses.json");
  fixture.responses["https://api.github.com/repos/example/alpha/contents/SECURITY.md"] = { status: 429 };

  const report = await runFixture({ fixture });
  const policyIssues = report.findings.filter(
    (item) => item.project === "current-project" && item.check === "security-policy",
  );

  assert.equal(report.projects.find((project) => project.id === "current-project").policyState, "indeterminate");
  assert.ok(policyIssues.some((item) => item.severity === "warning" && /conclusively/.test(item.message)));
  assert.ok(!policyIssues.some((item) => item.severity === "error" && /No SECURITY/.test(item.message)));
});

test("required missing policy becomes an error", async () => {
  const registry = readFixture("evidence-registry.json");
  registry.projects[1].securityPolicy.expectation = "required";

  const report = await runFixture({ registry });

  assert.ok(report.findings.some(
    (item) => item.project === "stale-project" && item.check === "security-policy" && item.severity === "error",
  ));
});

test("unsigned artifacts fail when their public disclosure is absent", async () => {
  const report = await runFixture({ disclosureCopy: "No artifact statement here." });

  assert.ok(report.findings.some(
    (item) => item.project === "stale-project" && item.check === "artifact-trust" && item.severity === "error",
  ));
});

test("broken links report sanitized URLs without response content", async () => {
  const registry = readFixture("evidence-registry.json");
  const fixture = readFixture("evidence-responses.json");
  const secretUrl = "https://alpha.example/private?token=do-not-print";
  registry.projects[0].surfaces[0].url = secretUrl;
  fixture.responses[secretUrl] = {
    status: 500,
    body: { debug: "do-not-print", authorization: "Bearer hidden" },
  };

  const report = await runFixture({ registry, fixture });
  const markdown = buildMarkdown(report);

  assert.match(markdown, /https:\/\/alpha\.example\/private/);
  assert.doesNotMatch(markdown, /do-not-print|Bearer hidden|token=/);
});

test("a soft-200 page fails when its configured public marker is absent", async () => {
  const registry = readFixture("evidence-registry.json");
  registry.projects[0].surfaces[0].expectedContent = "Expected evidence page marker";

  const report = await runFixture({ registry });

  assert.ok(report.findings.some(
    (item) => item.project === "current-project" && item.check === "link-content" && item.severity === "error",
  ));
});

test("registry validation rejects non-HTTPS evidence links", () => {
  const registry = readFixture("evidence-registry.json");
  registry.projects[0].surfaces[0].url = "http://alpha.example/";

  const findings = validateRegistry(registry);

  assert.ok(findings.some((item) => item.project === "current-project" && item.check === "links"));
});

test("unsafe registry URL is rejected before the requester can access it", async () => {
  const registry = readFixture("evidence-registry.json");
  const fixture = readFixture("evidence-responses.json");
  const unsafeUrl = "https://127.0.0.1/private";
  const requested = [];
  const fixtureRequester = createFixtureRequester(fixture);
  registry.projects[0].surfaces[0].url = unsafeUrl;

  await runAudit({
    registry,
    artifactManifest: readFixture("artifact-manifest.json"),
    request: async (url, options) => {
      requested.push(url);
      return fixtureRequester(url, options);
    },
    checkedAt: fixture.checkedAt,
    mode: "offline-fixture",
    rootDir,
    disclosureCopy: "Beta binaries are unsigned.",
  });

  assert.ok(!requested.includes(unsafeUrl));
});

test("live requester rejects a redirect to a non-public destination", async () => {
  const requested = [];
  const request = createLiveRequester({
    resolveHostname: async () => [{ address: "93.184.216.34", family: 4 }],
    fetchImpl: async (url) => {
      requested.push(url);
      return {
        status: 302,
        headers: { get: () => "http://169.254.169.254/latest/meta-data" },
        body: { cancel: async () => {} },
      };
    },
  });

  await assert.rejects(request("https://github.com/example"), { name: "UnsafeUrlError" });
  assert.deepEqual(requested, ["https://github.com/example"]);
});

test("expired registry review timestamp becomes an error", async () => {
  const registry = readFixture("evidence-registry.json");
  registry.lastReviewedAt = "2026-01-01T00:00:00Z";

  const report = await runFixture({ registry });

  assert.ok(report.findings.some(
    (item) => item.project === "registry" && item.check === "review-age" && item.severity === "error",
  ));
});

test("signed status requires signer and verification evidence", () => {
  const registry = readFixture("evidence-registry.json");
  registry.projects[0].artifactTrust = { status: "signed" };

  const findings = validateRegistry(registry, "2026-07-13T00:00:00Z");

  assert.ok(findings.some((item) => /verification evidence URL/.test(item.message)));
  assert.ok(findings.some((item) => /signer identity/.test(item.message)));
});

test("report explains that a clean check is not security certification", async () => {
  const report = await runFixture();

  assert.match(report.markdown, /does not certify project security/i);
  assert.match(report.markdown, /Response bodies, headers, credentials, tokens, and URL query strings are never included/);
});
