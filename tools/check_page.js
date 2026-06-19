const fs = require("fs");
const crypto = require("crypto");

const html = fs.readFileSync("index.html", "utf8");
const securityHtml = fs.readFileSync("security.html", "utf8");
const artifactManifest = JSON.parse(fs.readFileSync("artifact-manifest.json", "utf8"));
const scripts = [...`${html}\n${securityHtml}`.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

for (const script of scripts) {
  new Function(script);
}

const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)]
  .map((match) => match[1].split("#")[0]);
const missing = [...new Set(refs)].filter((ref) => !fs.existsSync(ref));
const requiredFiles = [
  "SECURITY.md",
  "security.html",
  "artifact-manifest.json",
  "_redirects",
  ".well-known/security.txt",
];
const missingRequired = requiredFiles.filter((ref) => !fs.existsSync(ref));
const requiredSnippets = [
  [html, 'href="security.html"', "index security policy link"],
  [html, "Report security issue", "index security report link"],
  [securityHtml, "Artifact integrity and signing", "security artifact section"],
  [securityHtml, "artifact-manifest.json", "security artifact manifest link"],
  [securityHtml, "mailto:meidie@mdpstudio.com.au", "security contact mailto"],
];
const missingSnippets = requiredSnippets
  .filter(([content, snippet]) => !content.includes(snippet))
  .map(([, , label]) => label);
const resumeArtifact = artifactManifest.artifacts.find((artifact) => artifact.id === "resume-pdf");
const resumeHash = crypto
  .createHash("sha256")
  .update(fs.readFileSync("assets/Meidie_Fei_Cyber_Security_Resume.pdf"))
  .digest("hex")
  .toUpperCase();
const manifestErrors = [];
if (!resumeArtifact) {
  manifestErrors.push("artifact manifest missing resume-pdf");
} else if (resumeArtifact.sha256 !== resumeHash) {
  manifestErrors.push("artifact manifest resume-pdf sha256 mismatch");
}
if (artifactManifest.schemaVersion !== "meidie-security-portfolio.artifact-manifest.v1") {
  manifestErrors.push("artifact manifest schemaVersion mismatch");
}

console.log(`scripts parsed: ${scripts.length}`);
console.log(`asset refs: ${refs.length}`);
console.log(`missing assets: ${missing.length}`);
console.log(`missing required files: ${missingRequired.length}`);
console.log(`missing required snippets: ${missingSnippets.length}`);
console.log(`manifest errors: ${manifestErrors.length}`);

if (missing.length || missingRequired.length || missingSnippets.length || manifestErrors.length) {
  console.log([...missing, ...missingRequired, ...missingSnippets, ...manifestErrors].join("\n"));
  process.exit(1);
}
