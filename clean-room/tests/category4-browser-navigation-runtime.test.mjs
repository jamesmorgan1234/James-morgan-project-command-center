import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

test("P4.3 shipped shell installs navigation ownership before the browser renderer", async () => {
  const html = await source("public/index.html");
  const navigationEntry = '/app/runtime/browser-navigation-runtime.js';
  const browserEntry = '/app/runtime/browser.js';
  assert.match(html, new RegExp(navigationEntry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(html, new RegExp(browserEntry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.ok(html.indexOf(navigationEntry) < html.indexOf(browserEntry));
});

test("P4.3 shipped navigation owner controls history pushes and post-render restoration", async () => {
  const runtime = await source("src/runtime/browser-navigation-runtime.ts");
  assert.match(runtime, /new BrowserNavigationCoordinator\(/);
  assert.match(runtime, /coordinator\.initialize\(\)/);
  assert.match(runtime, /window\.history\.pushState =/);
  assert.match(runtime, /coordinator\.navigate\(absoluteNavigationTarget\(url\)\)/);
  assert.match(runtime, /window\.addEventListener\("scroll", scheduleScrollCapture/);
  assert.match(runtime, /window\.addEventListener\("popstate"/);
  assert.match(runtime, /new MutationObserver\(/);
  assert.match(runtime, /coordinator\.restore\(state\)/);
});

test("P4.3 navigation ownership runtime is part of the offline shell cache", async () => {
  const sw = await source("public/sw.js");
  assert.match(sw, /\/app\/runtime\/browser-navigation-runtime\.js/);
  assert.match(sw, /\/app\/runtime\/browser-navigation\.js/);
  assert.match(sw, /\/app\/runtime\/browser\.js/);
});
