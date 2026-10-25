import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BrowserStartupCoordinator, isSafeBootstrapMessage } from "../dist/runtime/browser-startup.js";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

test("P4.2 startup remains private until the current generation commits ready", () => {
  const startup = new BrowserStartupCoordinator();
  const first = startup.begin();
  assert.equal(first.state, "loading");
  assert.equal(first.privateDataAllowed, false);
  const second = startup.begin();
  assert.equal(startup.commitReady(first.generation).state, "loading");
  assert.equal(startup.current.privateDataAllowed, false);
  const ready = startup.commitReady(second.generation);
  assert.equal(ready.state, "ready");
  assert.equal(ready.privateDataAllowed, true);
});

test("P4.2 degraded and failed startup states never authorize private data", () => {
  const degraded = new BrowserStartupCoordinator();
  const dg = degraded.begin().generation;
  assert.equal(degraded.degrade(dg).privateDataAllowed, false);
  const failed = new BrowserStartupCoordinator();
  const fg = failed.begin().generation;
  const view = failed.fail(fg);
  assert.equal(view.state, "failed");
  assert.equal(view.privateDataAllowed, false);
  assert.equal(failed.canCommit(fg), false);
  assert.equal(isSafeBootstrapMessage(view.message), true);
});

test("P4.2 shipped HTML contains only fixed non-private bootstrap state before runtime", async () => {
  const html = await source("public/index.html");
  assert.match(html, /data-command-center-bootstrap/);
  assert.match(html, /Starting Command Center…/);
  assert.ok(html.indexOf("browser-startup-runtime.js") < html.indexOf("browser-navigation-runtime.js"));
  assert.ok(html.indexOf("browser-navigation-runtime.js") < html.indexOf("browser.js"));
});

test("P4.2 shipped startup runtime handles failures without rendering exception content", async () => {
  const runtime = await source("src/runtime/browser-startup-runtime.ts");
  assert.match(runtime, /window\.addEventListener\("error"/);
  assert.match(runtime, /window\.addEventListener\("unhandledrejection"/);
  assert.match(runtime, /coordinator\.fail\(generation\)/);
  assert.match(runtime, /node\.replaceChildren\(\)/);
  assert.doesNotMatch(runtime, /event\.error/);
  assert.doesNotMatch(runtime, /event\.reason/);
  assert.doesNotMatch(runtime, /stack/);
});

test("P4.2 runtime root replacement keeps one rendered application tree", async () => {
  const browser = await source("src/runtime/browser.ts");
  assert.match(browser, /root\.replaceChildren\(\)/);
  assert.match(browser, /root\.append\(shell\)/);
  assert.doesNotMatch(browser, /root\.innerHTML\s*\+=/);
});

test("P4.2 startup boundary is included in the offline shell", async () => {
  const sw = await source("public/sw.js");
  assert.match(sw, /\/app\/runtime\/browser-startup-runtime\.js/);
  assert.match(sw, /\/app\/runtime\/browser-startup\.js/);
});
