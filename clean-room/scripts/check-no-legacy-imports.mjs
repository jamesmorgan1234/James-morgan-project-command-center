import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../src/", import.meta.url);
const prohibited = ["../legacy", "/legacy/", "old-agent", "cc7_agent_"];
const violations = [];

async function walk(url) {
  const entries = await readdir(url, { withFileTypes: true });
  for (const entry of entries) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, url);
    if (entry.isDirectory()) await walk(child);
    else if (entry.name.endsWith(".ts")) {
      const text = await readFile(child, "utf8");
      const lines = text.split(/\r?\n/);
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const isImportLike = /^\s*(?:import|export)\b/.test(line) || /\brequire\s*\(/.test(line) || /\bimport\s*\(/.test(line);
        if (!isImportLike) continue;
        for (const marker of prohibited) {
          if (line.includes(marker)) violations.push(`${child.pathname}:${index + 1}: ${line.trim()}`);
        }
      }
    }
  }
}

await walk(root);
if (violations.length > 0) {
  console.error("Legacy runtime dependency detected in clean-room imports:");
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log("PASS: no legacy runtime imports detected in clean-room source.");
