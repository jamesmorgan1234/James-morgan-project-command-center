import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCoreProjectSections } from "../dist/projects/index.js";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), "utf8");

const CORE_KEYS = [
  "project-section:snapshot",
  "project-section:owner-inputs",
  "project-section:history",
  "project-section:roadmap",
  "project-section:assets",
  "project-section:decisions",
  "project-section:integrations",
  "project-section:brain",
  "project-section:agency",
  "project-section:analytics",
  "project-section:conversation"
];

test("P5.9 shared project detail registry contains every universal project-room region including conversation", () => {
  const sections = createCoreProjectSections().forProjectType("project-type:software");
  assert.deepEqual(sections.map((section) => section.key), CORE_KEYS);
  assert.equal(sections.at(-1)?.title, "Conversation");
});

test("P5.9 unknown and future project types retain the generic universal Project Detail shell", () => {
  const registry = createCoreProjectSections();
  for (const typeKey of ["project-type:unknown", "project-type:future-unregistered"]) {
    const sections = registry.forProjectType(typeKey);
    assert.deepEqual(sections.map((section) => section.key), CORE_KEYS);
    assert.equal(sections.at(-1)?.title, "Conversation");
  }
});

test("P5.9 shipped Project Detail renders the universal shell and scopes cross-surface links to the project", async () => {
  const browser = await read("src/runtime/browser.ts");
  for (const key of CORE_KEYS) assert.match(browser, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(browser, /projectContextHref\("brain", project\.id\)/);
  assert.match(browser, /projectContextHref\("agency", project\.id\)/);
  assert.match(browser, /projectContextHref\("analytics", project\.id\)/);
  assert.match(browser, /projectContextHref\("brain", project\.id, "conversation"\)/);
  assert.match(browser, /params\.set\("mode", mode\)/);
});

test("P5.9 generic Project Detail no longer hardcodes book-only Series or Publication Status", async () => {
  const browser = await read("src/runtime/browser.ts");
  const projectDetail = browser.match(/function renderProjectDetail\([\s\S]*?\n\}\n\nfunction genericCard/)?.[0] ?? "";
  assert.ok(projectDetail.length > 0, "renderProjectDetail source must be discoverable");
  assert.doesNotMatch(projectDetail, /\bSERIES\b/);
  assert.doesNotMatch(projectDetail, /PUBLICATION STATUS/);
  assert.doesNotMatch(projectDetail, /project-type:/);
  assert.match(projectDetail, /appendDynamicProjectDetailSections\(section, project\)/);
});

test("P5.9 type-specific sections remain runtime-data driven rather than renderer switch logic", async () => {
  const browser = await read("src/runtime/browser.ts");
  const dynamic = browser.match(/function appendDynamicProjectDetailSections\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(dynamic, /project\.detailSections \?\? \[\]/);
  assert.match(dynamic, /detail\.title/);
  assert.match(dynamic, /detail\.content\.state/);
  assert.doesNotMatch(dynamic, /switch\s*\(/);
  assert.doesNotMatch(dynamic, /project-type:/);
});

test("P5.9 approved book-detail visual authority remains a fixture, not a universal renderer assumption", async () => {
  const fixtures = await read("src/ui/fixtures.ts");
  assert.match(fixtures, /project_detail_missing_hour/);
  assert.match(fixtures, /publication_status/);
  const browser = await read("src/runtime/browser.ts");
  assert.doesNotMatch(browser, /project-section:series/);
  assert.doesNotMatch(browser, /project-section:publication-status/);
});
