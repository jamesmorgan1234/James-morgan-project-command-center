import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

test("P4.8 Project Detail renders every owner-approved structural region", async () => {
  const browser = await source("src/runtime/browser.ts");
  const detail = browser.match(/function renderProjectDetail\([\s\S]*?\n\}/)?.[0] ?? "";
  for (const region of ["performance-grid", "series-strip", "publication-status", "history-row", "integrations-row"]) {
    assert.match(detail, new RegExp(region));
  }
  assert.match(detail, /project\.progressPercent/);
  assert.match(detail, /project\.stage/);
  assert.match(detail, /project\.priority/);
  assert.match(detail, /project\.needsMeCount/);
  assert.match(detail, /project\.recentActivity/);
  assert.match(detail, /Series data unavailable/);
  assert.match(detail, /Publication data unavailable/);
  assert.match(detail, /Integration data unavailable/);
});

test("P4.8 Project Detail required regions have dedicated phone-first styling", async () => {
  const css = await source("public/app.css");
  for (const selector of [".performance-grid", ".series-strip", ".publication-status", ".history-row", ".integrations-row"]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /\.performance-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
});
