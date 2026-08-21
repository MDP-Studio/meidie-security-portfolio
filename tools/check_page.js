const fs = require("fs");
const crypto = require("crypto");

const html = fs.readFileSync("index.html", "utf8");
const securityHtml = fs.readFileSync("security.html", "utf8");
const evidenceHtml = fs.readFileSync("evidence.html", "utf8");
const publicHtml = fs.readFileSync("public/index.html", "utf8");
const artifactManifest = JSON.parse(fs.readFileSync("artifact-manifest.json", "utf8"));
const evidenceRegistry = JSON.parse(fs.readFileSync("evidence-registry.json", "utf8"));
const evidenceReport = JSON.parse(fs.readFileSync("reports/evidence-freshness.json", "utf8"));
const publicCopy = `${html}\n${securityHtml}\n${evidenceHtml}`;
const scripts = [
  ...[...publicCopy.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]),
  fs.readFileSync("assets/site.js", "utf8"),
];

for (const script of scripts) {
  new Function(script);
}

const refs = [...publicCopy.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)]
  .map((match) => match[1].split("#")[0]);
const deployAssets = [
  "favicon.jpg",
  "linkedin-featured-portfolio.png",
  "Meidie_Fei_Cyber_Security_Resume.pdf",
  "site.css",
  "site.js",
  "screenshot-payshield.png",
  "screenshot-securevote.png",
];
const missing = [...new Set(refs)].filter((ref) => !fs.existsSync(ref));
const requiredFiles = [
  "SECURITY.md",
  "security.html",
  "evidence.html",
  "artifact-manifest.json",
  "evidence-registry.json",
  "reports/evidence-freshness.md",
  "reports/evidence-freshness.json",
  "_redirects",
  ".well-known/security.txt",
];
const missingRequired = requiredFiles.filter((ref) => !fs.existsSync(ref));
const requiredSnippets = [
  [html, 'href="security.html"', "index security policy link"],
  [html, 'href="evidence.html"', "index evidence health link"],
  [html, "Report an issue", "index security report link"],
  [html, "Graduate Security Engineer", "index single target role"],
  [html, "Student visa subclass 500", "index current work-right status"],
  [html, "15 March 2027", "index current visa expiry"],
  [html, "1 December 2026", "index full-time target start"],
  [html, "15-25 hours per week", "index current availability"],
  [html, "99%+ accuracy", "index paid-work outcome"],
  [html, "1,384 tests", "index phishing validation"],
  [html, "Current v0.3.4 public build is an unsigned historical beta", "index RMM trust boundary"],
  [html, "243-test collection", "index SecureVote validation"],
  [html, "A graduate team, not a solo-expert title.", "index entry-level role calibration"],
  [html, '<link rel="stylesheet" href="assets/site.css">', "index shared stylesheet"],
  [publicHtml, "Graduate Security Engineer", "public index single target role"],
  [publicHtml, "Student visa subclass 500", "public index work-right status"],
  [securityHtml, "Artifact integrity and signing", "security artifact section"],
  [securityHtml, "artifact-manifest.json", "security artifact manifest link"],
  [securityHtml, "mailto:meidie@mdpstudio.com.au", "security contact mailto"],
  [securityHtml, "The portfolio resume PDF is unsigned", "resume unsigned disclosure"],
  [securityHtml, "Current public Windows builds are unsigned beta artifacts", "RMM unsigned disclosure"],
  [securityHtml, "not operating-system code signing or cryptographic certification", "AES signing boundary"],
  [evidenceHtml, "Portfolio evidence should expire loudly", "evidence methodology heading"],
  [evidenceHtml, "reports/evidence-freshness.md", "evidence Markdown report link"],
  [evidenceHtml, "evidence-registry.json", "evidence registry link"],
];
const missingSnippets = requiredSnippets
  .filter(([content, snippet]) => !content.includes(snippet))
  .map(([, , label]) => label);
const staleSnippets = [
  "Security projects recruiters can open, test, and review.",
  "Support the lab.",
  "Buy me a coffee",
  "Co-founder and technical lead",
  "a pre-revenue web and AI venture",
  "ApplyPilot is a local prototype",
  "Discuss a project",
  "Visit MDP Studio",
  'href="https://mdpstudio.com.au/"',
  'href="https://mdpstudio.com.au/projects/meidie-security-portfolio/"',
]
  .filter((snippet) => html.includes(snippet))
  .map((snippet) => `stale homepage copy remains: ${snippet}`);

const manifestErrors = [];
const resumeArtifact = artifactManifest.artifacts.find((artifact) => artifact.id === "resume-pdf");
const resumeHash = crypto
  .createHash("sha256")
  .update(fs.readFileSync("assets/Meidie_Fei_Cyber_Security_Resume.pdf"))
  .digest("hex")
  .toUpperCase();
if (!resumeArtifact) {
  manifestErrors.push("artifact manifest missing resume-pdf");
} else if (resumeArtifact.sha256 !== resumeHash) {
  manifestErrors.push("artifact manifest resume-pdf sha256 mismatch");
}
if (artifactManifest.schemaVersion !== "meidie-security-portfolio.artifact-manifest.v1") {
  manifestErrors.push("artifact manifest schemaVersion mismatch");
}
const allowedSigningStates = new Set([
  "signed",
  "attested-not-code-signed",
  "unsigned-disclosed",
  "checksum-only-unsigned",
  "not-applicable",
]);
for (const artifact of artifactManifest.artifacts || []) {
  if (!allowedSigningStates.has(artifact.signingStatus)) {
    manifestErrors.push(`artifact ${artifact.id} missing explicit signingStatus`);
  }
  if (
    ["attested-not-code-signed", "unsigned-disclosed", "checksum-only-unsigned"].includes(artifact.signingStatus)
    && (!artifact.disclosure || !artifact.disclosureUrl || !publicCopy.includes(artifact.disclosure))
  ) {
    manifestErrors.push(`artifact ${artifact.id} missing public trust disclosure`);
  }
}

if (evidenceRegistry.schemaVersion !== "meidie-security-portfolio.evidence-registry.v1") {
  manifestErrors.push("evidence registry schemaVersion mismatch");
}
const registryIds = new Set();
for (const project of evidenceRegistry.projects || []) {
  if (!project.id || registryIds.has(project.id)) {
    manifestErrors.push(`evidence registry duplicate or missing project id: ${project.id || "unknown"}`);
  }
  registryIds.add(project.id);
  if (!project.repository || !project.defaultBranch || !Array.isArray(project.surfaces) || project.surfaces.length === 0) {
    manifestErrors.push(`evidence registry incomplete project: ${project.id || "unknown"}`);
  }
  if (
    project.artifactTrust
    && ["attested-not-code-signed", "unsigned-disclosed", "checksum-only-unsigned"].includes(project.artifactTrust.status)
    && (!project.artifactTrust.disclosureText || !publicCopy.includes(project.artifactTrust.disclosureText))
  ) {
    manifestErrors.push(`evidence registry trust disclosure missing from public copy: ${project.id}`);
  }
}
if (evidenceReport.schemaVersion !== "meidie-security-portfolio.evidence-report.v1") {
  manifestErrors.push("evidence report schemaVersion mismatch");
}

const syncedFiles = [
  "index.html",
  "security.html",
  "evidence.html",
  "SECURITY.md",
  "artifact-manifest.json",
  "evidence-registry.json",
  "reports/evidence-freshness.md",
  "reports/evidence-freshness.json",
  "robots.txt",
  "sitemap.xml",
  "_redirects",
  ".well-known/security.txt",
];
const syncErrors = syncedFiles
  .filter((source) => {
    const deployed = `public/${source}`;
    return !fs.existsSync(deployed) || fs.readFileSync(source).compare(fs.readFileSync(deployed)) !== 0;
  })
  .map((source) => `public copy is stale or missing: ${source}`);
for (const asset of deployAssets) {
  const source = `assets/${asset}`;
  const deployed = `public/assets/${asset}`;
  if (!fs.existsSync(source) || !fs.existsSync(deployed) || fs.readFileSync(source).compare(fs.readFileSync(deployed)) !== 0) {
    syncErrors.push(`public asset is stale or missing: ${asset}`);
  }
}
if (fs.existsSync("public/assets")) {
  const expectedAssets = new Set(deployAssets);
  for (const entry of fs.readdirSync("public/assets", { withFileTypes: true })) {
    if (!entry.isFile() || !expectedAssets.has(entry.name)) {
      syncErrors.push(`unexpected public asset: ${entry.name}`);
    }
  }
}

console.log(`scripts parsed: ${scripts.length}`);
console.log(`asset refs: ${refs.length}`);
console.log(`missing assets: ${missing.length}`);
console.log(`missing required files: ${missingRequired.length}`);
console.log(`missing required snippets: ${missingSnippets.length}`);
console.log(`stale snippets: ${staleSnippets.length}`);
console.log(`public sync errors: ${syncErrors.length}`);
console.log(`manifest errors: ${manifestErrors.length}`);

if (missing.length || missingRequired.length || missingSnippets.length || staleSnippets.length || syncErrors.length || manifestErrors.length) {
  console.log([...missing, ...missingRequired, ...missingSnippets, ...staleSnippets, ...syncErrors, ...manifestErrors].join("\n"));
  process.exit(1);
}
