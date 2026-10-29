import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { createCoreRouteRegistry } from "../dist/ui/routes.js";
import { createDisconnectedRuntimeSnapshot, createFixtureRuntimeSnapshot } from "../dist/runtime/snapshot.js";
import { HttpRuntimeSnapshotProvider } from "../dist/runtime/provider.js";

const ROOT = new URL("../", import.meta.url);
const EXPECTED_ICON_HASH = "fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa";
const CANONICAL_INSTANT = "2026-10-29T12:00:00.000Z";

function httpJson(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

function validRuntimeProject() {
  return {
    id: "project-1",
    name: "Project One",
    mission: { state: "known", value: "Build verified runtime truth" },
    lifecycle: { state: "unknown" },
    verification: { state: "not_applicable" },
    priority: { state: "known", value: "high" },
    stage: { state: "known", value: "building" },
    status: { state: "known", value: "active" },
    progressPercent: { state: "known", value: 50 },
    currentCheckpoint: { state: "unknown" },
    nextAction: { state: "known", value: "Verify transport boundary" },
    blockers: { state: "known", value: [] },
    needsMeCount: { state: "known", value: 0 },
    agencyState: { state: "unknown" },
    recentActivity: { state: "known", value: ["Validated runtime snapshot"] },
    typeKey: { state: "known", value: "project-type:software" },
    companyId: { state: "not_applicable" },
    detailSections: [{
      key: "project-section:runtime",
      title: "Runtime",
      sortOrder: 10,
      required: true,
      content: { state: "unknown" },
      evidence: [{ source: "test:detail", observedAt: CANONICAL_INSTANT }]
    }],
    evidence: [{ source: "test:project", observedAt: CANONICAL_INSTANT }]
  };
}

function mutableHttpFixture() {
  return JSON.parse(JSON.stringify(createFixtureRuntimeSnapshot({
    generatedAt: CANONICAL_INSTANT,
    connection: {
      state: "connected",
      providerId: "runtime:test-http",
      message: "Connected test runtime",
      lastSuccessfulSyncAt: { state: "known", value: CANONICAL_INSTANT }
    },
    owner: { displayName: { state: "unknown" } },
    projects: [validRuntimeProject()],
    release: {
      releaseId: { state: "not_applicable" },
      knownGoodReleaseId: { state: "unknown" }
    }
  })));
}

async function loadHttpPayload(payload) {
  const provider = new HttpRuntimeSnapshotProvider({ endpoint: "/api/runtime", fetcher: async () => httpJson(payload) });
  return provider.load();
}

function assertDisconnectedFallback(snapshot) {
  assert.equal(snapshot.connection.state, "disconnected");
  assert.equal(snapshot.connection.providerId, "runtime:http");
  assert.equal(snapshot.projects.length, 0);
}

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

test("HTTP provider rejects malformed timestamps, null entries and incomplete nested runtime shapes", async () => {
  const invalidPayloads = [];

  const invalidGeneratedAt = mutableHttpFixture();
  invalidGeneratedAt.generatedAt = "2026-02-30T00:00:00Z";
  invalidPayloads.push(invalidGeneratedAt);

  const naiveSyncTime = mutableHttpFixture();
  naiveSyncTime.connection.lastSuccessfulSyncAt = { state: "known", value: "2026-10-29T12:00:00" };
  invalidPayloads.push(naiveSyncTime);

  const invalidEvidenceTime = mutableHttpFixture();
  invalidEvidenceTime.projects[0].evidence[0].observedAt = "not-a-time";
  invalidPayloads.push(invalidEvidenceTime);

  const nullProject = mutableHttpFixture();
  nullProject.projects = [null];
  invalidPayloads.push(nullProject);

  const nullSurface = mutableHttpFixture();
  nullSurface.surfaces = [null];
  invalidPayloads.push(nullSurface);

  const incompleteDetailSection = mutableHttpFixture();
  delete incompleteDetailSection.projects[0].detailSections[0].content;
  invalidPayloads.push(incompleteDetailSection);

  const malformedLiveExecution = mutableHttpFixture();
  malformedLiveExecution.projects[0].liveExecution = { state: "known", value: { runId: "run-1" } };
  invalidPayloads.push(malformedLiveExecution);

  const malformedNextWork = mutableHttpFixture();
  malformedNextWork.projects[0].nextWorkReadiness = { state: "known", value: { workUnitId: "w1", ready: true } };
  invalidPayloads.push(malformedNextWork);

  for (const payload of invalidPayloads) assertDisconnectedFallback(await loadHttpPayload(payload));
});

test("HTTP provider accepts valid unknown/not-applicable truth and harmless future fields", async () => {
  const payload = mutableHttpFixture();
  payload.futureTransportMetadata = { version: 2 };
  payload.projects[0].futureProjectMetadata = { optional: true };
  payload.projects[0].mission = { state: "not_applicable" };
  payload.projects[0].lifecycle = { state: "unknown" };
  payload.projects[0].liveExecution = { state: "unknown" };
  payload.projects[0].nextWorkReadiness = { state: "not_applicable" };

  const snapshot = await loadHttpPayload(payload);
  assert.equal(snapshot.connection.state, "connected");
  assert.equal(snapshot.projects.length, 1);
  assert.equal(snapshot.projects[0].id, "project-1");
  assert.equal(snapshot.projects[0].mission.state, "not_applicable");
  assert.equal(snapshot.projects[0].lifecycle.state, "unknown");
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
