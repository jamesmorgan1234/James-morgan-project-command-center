import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { filterRuntimeProjects, groupRuntimeProjects, projectFacetValues, projectFilterFromSearch } from "../dist/runtime/project-screen.js";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), "utf8");
const known = (value) => ({ state: "known", value });
const unknown = () => ({ state: "unknown" });

function project(id, name, type, company, lifecycle, priority) {
  return {
    id,
    name,
    mission: known(`${name} mission`),
    lifecycle: known(lifecycle),
    verification: known("verified"),
    priority: known(priority),
    stage: unknown(),
    status: known("building"),
    progressPercent: unknown(),
    currentCheckpoint: unknown(),
    nextAction: unknown(),
    blockers: known([]),
    needsMeCount: known(0),
    agencyState: unknown(),
    recentActivity: known([]),
    evidence: [{ source: "test" }],
    typeKey: type ? known(type) : unknown(),
    companyId: company ? known(company) : unknown(),
    detailSections: []
  };
}

const FIXTURES = [
  project("a", "Alpha", "project-type:software", "company:one", "active", "high"),
  project("b", "Beta", "project-type:book", "company:one", "paused", "normal"),
  project("c", "Gamma", "project-type:software", "company:two", "active", "critical")
];

test("P5.6 runtime project screen filters and groups generically without project-name hardcoding", () => {
  const filter = projectFilterFromSearch("?q=gamma&type=project-type%3Asoftware&company=company%3Atwo&group=type");
  const filtered = filterRuntimeProjects(FIXTURES, filter);
  assert.deepEqual(filtered.map((item) => item.id), ["c"]);
  const groups = groupRuntimeProjects(FIXTURES, "company");
  assert.deepEqual(groups.map((group) => [group.key, group.projects.length]), [["company:one", 2], ["company:two", 1]]);
  const facets = projectFacetValues(FIXTURES);
  assert.deepEqual(facets.typeKeys, ["project-type:book", "project-type:software"]);
  assert.deepEqual(facets.companyIds, ["company:one", "company:two"]);
});

test("P5.6 browser exposes generic project search/filter/group controls and project metadata", async () => {
  const browser = await read("src/runtime/browser.ts");
  assert.match(browser, /projectFilterFromSearch\(window\.location\.search\)/);
  assert.match(browser, /filterRuntimeProjects\(snapshot\.projects, filter\)/);
  assert.match(browser, /groupRuntimeProjects\(filtered, filter\.groupBy/);
  for (const key of ["lifecycle", "priority", "type", "company", "group"]) assert.match(browser, new RegExp(`"${key}"`));
  assert.match(browser, /Type: \$\{runtimeTruthValue\(project\.typeKey\)\}/);
  assert.match(browser, /Company: \$\{runtimeTruthValue\(project\.companyId\)\}/);
});

test("P5.9 browser renders type-bound detail sections generically without type-specific switch logic", async () => {
  const browser = await read("src/runtime/browser.ts");
  const dynamic = browser.match(/function appendDynamicProjectDetailSections\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(dynamic, /project\.detailSections \?\? \[\]/);
  assert.match(dynamic, /detail\.title/);
  assert.match(dynamic, /detail\.content\.state/);
  assert.match(dynamic, /No verified content is available for this type-specific section/);
  assert.doesNotMatch(dynamic, /switch\s*\(\s*detail\.key/);
  assert.doesNotMatch(dynamic, /project-type:/);
});

test("P5 project controls preserve 48px accessibility and offline shell support", async () => {
  const css = await read("public/project-system.css");
  const html = await read("public/index.html");
  const sw = await read("public/sw.js");
  assert.match(css, /min-height:var\(--cc-tap\)/);
  assert.match(css, /project-filter-control:focus-visible/);
  assert.match(html, /project-system\.css/);
  assert.match(sw, /"\/project-system\.css"/);
});
