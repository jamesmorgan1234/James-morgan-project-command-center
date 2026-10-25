import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

test("P4.8 approved book-specific Project Detail authority remains explicitly registered", async () => {
  const fixtures = await source("src/ui/fixtures.ts");
  assert.match(fixtures, /project_detail_missing_hour/);
  for (const region of ["screen_header", "project_hero", "performance_grid", "series_strip", "publication_status", "history_row", "integrations_row"]) {
    assert.match(fixtures, new RegExp(region));
  }
});

test("P4.8 generic Project Detail preserves shared approved structure without forcing book-only regions", async () => {
  const browser = await source("src/runtime/browser.ts");
  const detail = browser.match(/function renderProjectDetail\([\s\S]*?\n\}/)?.[0] ?? "";
  for (const region of ["performance-grid", "history-row", "integrations-row", "owner-inputs-section", "roadmap-section"]) {
    assert.match(detail, new RegExp(region));
  }
  assert.match(detail, /project\.progressPercent/);
  assert.match(detail, /project\.stage/);
  assert.match(detail, /project\.priority/);
  assert.match(detail, /project\.needsMeCount/);
  assert.match(detail, /project\.recentActivity/);
  assert.match(detail, /Integration data unavailable/);
  assert.match(detail, /appendDynamicProjectDetailSections/);
  assert.doesNotMatch(detail, /series-strip|publication-status|Series data unavailable|Publication data unavailable/);
});

test("P4.8 approved Project Detail visual regions retain dedicated phone-first styling", async () => {
  const css = await source("public/app.css");
  for (const selector of [".performance-grid", ".series-strip", ".publication-status", ".history-row", ".integrations-row"]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /\.performance-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/s);
});
