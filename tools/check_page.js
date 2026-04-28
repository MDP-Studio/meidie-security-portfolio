const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

for (const script of scripts) {
  new Function(script);
}

const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)]
  .map((match) => match[1].split("#")[0]);
const missing = [...new Set(refs)].filter((ref) => !fs.existsSync(ref));

console.log(`scripts parsed: ${scripts.length}`);
console.log(`asset refs: ${refs.length}`);
console.log(`missing assets: ${missing.length}`);

if (missing.length) {
  console.log(missing.join("\n"));
  process.exit(1);
}
