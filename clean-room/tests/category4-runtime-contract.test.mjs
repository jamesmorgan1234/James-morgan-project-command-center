import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);

async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

test("P4.1 runtime CSS stays aligned with canonical design-token values and accessible control size", async () => {
  const css = await source("public/app.css");
  assert.match(css, /--cc-orange:#ff6a00/);
  assert.match(css, /--cc-bevel:16px/);
  assert.match(css, /--cc-tap:48px/);
  assert.match(css, /\.nav-link[^}]*min-height:var\(--cc-tap\)/s);
  assert.match(css, /\.pwa-update__button[^}]*min-height:var\(--cc-tap\)/s);
});

test("P4.2 runtime uses one canonical phone bottom-navigation hierarchy with controlled overflow", async () => {
  const browser = await source("src/runtime/browser.ts");
  const css = await source("public/app.css");
  assert.match(browser, /const PRIMARY_NAV_ROUTE_KEYS = Object\.freeze\(\["route:home", "route:projects", "route:active-live", "route:next-up"\]/);
  assert.match(browser, /className = "bottom-nav__link"/);
  assert.match(browser, /navigation-overflow/);
  assert.match(browser, /shell\.append\(main, navigation\(\)\)/);
  assert.match(css, /\.primary-nav\{[^}]*position:fixed;[^}]*bottom:0/s);
  assert.match(css, /\.bottom-nav__primary\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/s);
});

test("P4.4 browser Home obeys the four-module one-column contract instead of generic dashboard cards", async () => {
  const browser = await source("src/runtime/browser.ts");
  const css = await source("public/app.css");
  const homeBlock = browser.match(/function renderHome\([\s\S]*?\n\}/)?.[0] ?? "";
  for (const title of ["Projects", "Active / Live", "Next Up", "Needs Me"]) assert.match(homeBlock, new RegExp(`"${title.replace("/", "\\/")}"`));
  assert.doesNotMatch(homeBlock, /"Agency"|"Release"/);
  assert.match(css, /\.home-grid\{[^}]*grid-template-columns:1fr/s);
  assert.match(css, /\.home-primary-card\{[^}]*min-height:/s);
});
