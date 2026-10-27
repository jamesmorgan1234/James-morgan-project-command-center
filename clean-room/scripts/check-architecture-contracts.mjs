import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL("../src/", import.meta.url));

const prohibitedPatterns = [
  { label: "incremental innerHTML patch", pattern: /\.innerHTML\s*\+=/ },
  { label: "document.write runtime patch", pattern: /\bdocument\.write\s*\(/ },
  {
    label: "native prototype assignment",
    pattern: /\b(?:Window|Document|Element|HTMLElement|EventTarget|Node|Array|Object|Promise|String|Number)\.prototype\.[A-Za-z_$][\w$]*\s*=/
  },
  {
    label: "native prototype defineProperty patch",
    pattern: /\bObject\.definePropert(?:y|ies)\s*\(\s*(?:Window|Document|Element|HTMLElement|EventTarget|Node|Array|Object|Promise|String|Number)\.prototype\b/
  }
];

const violations = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".mjs")) continue;
    const text = await readFile(path, "utf8");
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      for (const policy of prohibitedPatterns) {
        if (policy.pattern.test(lines[index])) violations.push(`${path}:${index + 1}: ${policy.label}: ${lines[index].trim()}`);
      }
    }
  }
}

await walk(root);
if (violations.length > 0) {
  console.error("Prohibited runtime patch pattern detected:");
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log("PASS: architecture source contains no prohibited runtime patch patterns.");
