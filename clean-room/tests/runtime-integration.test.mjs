import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { createCoreRouteRegistry } from "../dist/ui/routes.js";
import { createDisconnectedRuntimeSnapshot } from "../dist/runtime/snapshot.js";
import { HttpRuntimeSnapshotProvider } from "../dist/runtime/provider.js";

const ROOT = new URL("../", import.meta.url);
const EXPECTED_ICON_HASH = "fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa";

test("runtime exposes the locked major routes and resolves dynamic project paths", () => {
  const routes = createCoreRouteRegistry();
  for (const path of ["/", "/projects", "/brain", "/agency", "/needs-me", "/search", "/automations", "/personal", "/finance", "/social", "/books", "/specialists", "/analytics", "/settings", "/settings/security", "/settings/devices"]) {
    assert.ok(routes.resolve(path), `missing route ${path}`);
  }
  const project = routes.resolve("/project/edge-finder?tab=agency#live");
  assert.equal(project?.route.key, "route:project-detail");
  assert.equal(project?.params.projectId, "edge-finder");
});

test("disconnected runtime preserves unknown truth and never fabricates project totals", () => {
  const snapshot = createDisconnectedRuntimeSnapshot("test", "2026-10-23T00:00:00.000Z");
  assert.equal(snapshot.connection.state, "disconnected");
  assert.equal(snapshot.projects.length, 0);
  assert.equal(snapshot.release.releaseId.state, "unknown");
  assert.match(snapshot.connection.message, /unavailable rather than being fabricated/i);
});

test("HTTP provider fails closed to a disconnected snapshot", async () => {
  const provider = new HttpRuntimeSnapshotProvider({ endpoint: "/api/runtime", fetcher: async () => { throw new Error("offline"); } });
  const snapshot = await provider.load();
  assert.equal(snapshot.connection.state, "disconnected");
  assert.equal(snapshot.projects.length, 0);
});

test("browser build contains a standalone shell, startup-bound runtime entry, release identity and two-phase update gate", async () => {
  for (const path of ["dist-web/index.html", "dist-web/app.css", "dist-web/manifest.webmanifest", "dist-web/sw.js", "dist-web/release.json", "dist-web/app/runtime/browser-entrypoint.js", "dist-web/app/runtime/browser.js"]) {
    assert.equal(existsSync(new URL(path, ROOT)), true, `missing ${path}`);
  }
  const html = await readFile(new URL("dist-web/index.html", ROOT), "utf8");
  const sw = await readFile(new URL("dist-web/sw.js", ROOT), "utf8");
  const release = JSON.parse(await readFile(new URL("dist-web/release.json", ROOT), "utf8"));
  assert.match(html, /\/app\/runtime\/browser-entrypoint\.js/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /__COMMAND_CENTER_RELEASE_ID__/);
  assert.doesNotMatch(sw, /__COMMAND_CENTER_RELEASE_ID__/);
  assert.match(sw, /ACTIVATE_UPDATE/);
  const installBody = sw.slice(sw.indexOf('addEventListener("install"'), sw.indexOf('addEventListener("message"'));
  assert.doesNotMatch(installBody, /skipWaiting/);
  for (const key of ["releaseId", "buildHash", "assetManifestHash", "schemaCompatibility"]) assert.equal(typeof release[key], "string");
});

test("protected icon is never substituted: absent stays explicit, present must match approved hash", async () => {
  const status = JSON.parse(await readFile(new URL("dist-web/pwa-assets.json", ROOT), "utf8"));
  const sourceUrl = new URL("public/assets/command-center-approved-icon-512.png", ROOT);
  if (!existsSync(sourceUrl)) {
    assert.equal(status.approvedIcon, "missing");
    const manifest = JSON.parse(await readFile(new URL("dist-web/manifest.webmanifest", ROOT), "utf8"));
    assert.deepEqual(manifest.icons, []);
    return;
  }
  const bytes = await readFile(sourceUrl);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), EXPECTED_ICON_HASH);
  assert.equal(status.approvedIcon, "verified");
});
