import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertAccessibleControl } from "../dist/ui/device.js";

const ROOT = new URL("../", import.meta.url);

async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

test("P4.6 service worker never caches protected API/auth GET responses", async () => {
  const sw = await source("public/sw.js");
  assert.match(sw, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(sw, /pathname\.startsWith\("\/__cc_auth__\/"\)/);
  assert.match(sw, /pathname\.startsWith\("\/auth\/"\)/);
  assert.match(sw, /event\.respondWith\(networkOnly\(request\)\)/);
  assert.match(sw, /return fetch\(request, \{ cache: "no-store" \}\)/);
  assert.match(sw, /isCacheableShellPath/);
  assert.doesNotMatch(sw, /if \(response\.ok && request\.method === "GET" && new URL\(request\.url\)\.origin === self\.location\.origin\)/);
});

test("P4.6 shell cache remains bounded while preserving current and recovery releases, and activation is explicit", async () => {
  const sw = await source("public/sw.js");
  assert.match(sw, /const protectedKeys = new Set\(\[CURRENT_CACHE\]\)/);
  assert.match(sw, /if \(state\.knownGoodReleaseId\) protectedKeys\.add\(shellCacheName\(state\.knownGoodReleaseId\)\)/);
  assert.match(sw, /if \(state\.fallbackReleaseId\) protectedKeys\.add\(shellCacheName\(state\.fallbackReleaseId\)\)/);
  assert.match(sw, /const optionalSlots = Math\.max\(0, 2 - protectedKeys\.size\)/);
  assert.match(sw, /records\.filter\(\(record\) => !protectedKeys\.has\(record\.key\)\)\.map\(\(record\) => caches\.delete\(record\.key\)\)/);
  assert.match(sw, /event\.data\?\.type === "ACTIVATE_UPDATE"/);
  const installBody = sw.slice(sw.indexOf('addEventListener("install"'), sw.indexOf('addEventListener("message"'));
  assert.doesNotMatch(installBody, /skipWaiting/);
});

test("P4.7 canonical accessibility gate requires 48px controls and labels", () => {
  assert.doesNotThrow(() => assertAccessibleControl({ width: 48, height: 48, ariaLabel: "Open Projects" }));
  assert.throws(() => assertAccessibleControl({ width: 47, height: 48, ariaLabel: "Too narrow" }), /48px/);
  assert.throws(() => assertAccessibleControl({ width: 48, height: 47, ariaLabel: "Too short" }), /48px/);
  assert.throws(() => assertAccessibleControl({ width: 48, height: 48 }), /accessible label/i);
});
