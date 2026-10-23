import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);

test("browser runtime keeps approved Projects, Active / Live, Next Up and Project Detail as distinct structures", async () => {
  const source = await readFile(new URL("src/runtime/browser.ts", ROOT), "utf8");
  for (const fn of ["renderProjects", "renderActive", "renderNextUp", "renderProjectDetail"]) assert.match(source, new RegExp(`function ${fn}\\(`));
  assert.match(source, /case "route:active-live": return renderActive/);
  assert.match(source, /case "route:next-up": return renderNextUp/);
  assert.doesNotMatch(source, /case "route:active-live":[\s\S]{0,80}renderProjects/);
});

test("browser visual shell uses the locked beveled phone-first control-system geometry", async () => {
  const css = await readFile(new URL("public/app.css", ROOT), "utf8");
  for (const marker of ["clip-path:polygon", ".back-control", ".project-row", ".active-row", ".next-row", ".progress-ring", ".header-planet", ".row-chevron"]) assert.match(css, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(css, /--cc-orange:#ff7900/);
});
