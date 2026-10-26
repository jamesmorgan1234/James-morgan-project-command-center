import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classifyLayout, assertAccessibleControl, motionDuration } from "../dist/ui/device.js";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

test("P4.7 device classification covers compact phone through desktop and reduced motion fails to zero", () => {
  assert.equal(classifyLayout({ width: 320, height: 640, pixelRatio: 2, reducedMotion: false, highContrast: false }), "compact_phone");
  assert.equal(classifyLayout({ width: 412, height: 915, pixelRatio: 3, reducedMotion: false, highContrast: false }), "phone");
  assert.equal(classifyLayout({ width: 800, height: 1280, pixelRatio: 2, reducedMotion: false, highContrast: false }), "tablet");
  assert.equal(classifyLayout({ width: 1440, height: 900, pixelRatio: 1, reducedMotion: false, highContrast: false }), "desktop");
  assert.equal(motionDuration({ width: 412, height: 915, pixelRatio: 3, reducedMotion: true, highContrast: false }), 0);
});

test("P4.7 canonical touch gate requires both 48px geometry and accessible naming", () => {
  assert.doesNotThrow(() => assertAccessibleControl({ width: 48, height: 48, ariaLabel: "Back" }));
  assert.throws(() => assertAccessibleControl({ width: 47, height: 48, ariaLabel: "Back" }), /48px/);
  assert.throws(() => assertAccessibleControl({ width: 48, height: 48 }), /accessible label/i);
});

test("P4.7 accessibility and reduced-motion contracts fail closed on invalid device or motion input", () => {
  assert.throws(
    () => classifyLayout({ width: 0, height: 915, pixelRatio: 3, reducedMotion: false, highContrast: false }),
    /must be positive/
  );
  assert.throws(
    () => classifyLayout({ width: 412, height: 915, pixelRatio: 0, reducedMotion: false, highContrast: false }),
    /must be positive/
  );
  assert.throws(
    () => motionDuration({ width: 412, height: 915, pixelRatio: 3, reducedMotion: false, highContrast: false }, -1),
    /non-negative/
  );
  assert.equal(
    motionDuration({ width: 1440, height: 900, pixelRatio: 1, reducedMotion: true, highContrast: false }, 250),
    0
  );
});

test("P4.7 shipped shell preserves browser zoom and safe-area adaptation", async () => {
  const html = await source("public/index.html");
  const css = await source("public/app.css");
  assert.match(html, /width=device-width,initial-scale=1,viewport-fit=cover/);
  assert.doesNotMatch(html, /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(html, /maximum-scale\s*=\s*1/i);
  assert.match(css, /env\(safe-area-inset-top\)/);
  assert.match(css, /env\(safe-area-inset-right\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /env\(safe-area-inset-left\)/);
});

test("P4.7 shipped CSS provides visible focus, 48px controls and global reduced-motion behavior", async () => {
  const css = await source("public/app.css");
  const projectCss = await source("public/project-system.css");
  assert.match(css, /--cc-tap:48px/);
  assert.match(css, /a:focus-visible,summary:focus-visible,button:focus-visible\{outline:3px solid var\(--cc-gold\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\*,\*::before,\*::after\{scroll-behavior:auto!important;transition:none!important;animation:none!important\}\}/);
  assert.match(projectCss, /min-height:var\(--cc-tap\)/);
  assert.match(projectCss, /\.project-navigation-card:focus-visible\{outline:3px solid var\(--cc-gold\)/);
});

test("P4.7 high-contrast and forced-colors adaptation applies to the real card/navigation/status system", async () => {
  const css = await source("public/primitive-system.css");
  assert.match(css, /@media\(prefers-contrast:more\)/);
  assert.match(css, /@media\(forced-colors:active\)/);
  for (const marker of [".bevel-card", ".status", ".primary-nav", ".navigation-grid", ".bottom-nav__link", ".project-filter-button"]) {
    assert.match(css, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /outline:3px solid Highlight!important/);
  assert.match(css, /\.header-planet,\.project-art\{display:none!important\}/);
});

test("P4.7 narrow-layout styles avoid fixed text boxes and retain wrapping for state content", async () => {
  const primitiveCss = await source("public/primitive-system.css");
  const appCss = await source("public/app.css");
  assert.match(primitiveCss, /@media\(max-width:360px\)/);
  assert.match(primitiveCss, /overflow-wrap:anywhere/);
  assert.match(appCss, /overflow-wrap:anywhere/);
  assert.doesNotMatch(appCss, /user-select:none/);
});
