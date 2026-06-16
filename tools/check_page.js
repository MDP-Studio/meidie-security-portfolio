const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const securityHtml = fs.readFileSync("security.html", "utf8");
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
  "_redirects",
  ".well-known/security.txt",
];
const missingRequired = requiredFiles.filter((ref) => !fs.existsSync(ref));
const requiredSnippets = [
  [html, 'href="security.html"', "index security policy link"],
  [html, "Report security issue", "index security report link"],
  [securityHtml, "Artifact integrity and signing", "security artifact section"],
  [securityHtml, "mailto:meidie@mdpstudio.com.au", "security contact mailto"],
];
const missingSnippets = requiredSnippets
  .filter(([content, snippet]) => !content.includes(snippet))
  .map(([, , label]) => label);

console.log(`scripts parsed: ${scripts.length}`);
console.log(`asset refs: ${refs.length}`);
console.log(`missing assets: ${missing.length}`);
console.log(`missing required files: ${missingRequired.length}`);
console.log(`missing required snippets: ${missingSnippets.length}`);

if (missing.length || missingRequired.length || missingSnippets.length) {
  console.log([...missing, ...missingRequired, ...missingSnippets].join("\n"));
  process.exit(1);
}
