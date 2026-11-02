import assert from "node:assert/strict";
import { test } from "node:test";

import { filterRuntimeProjects, groupRuntimeProjects } from "../dist/runtime/project-screen.js";

function known(value) { return Object.freeze({ state: "known", value }); }
function project(id, name, companyId) {
  return Object.freeze({
    id,
    name,
    lifecycle: known("active"),
    companyId: companyId ? known(companyId) : Object.freeze({ state: "unknown" })
  });
}

test("projects render canonical companies in locked activation order before unranked projects alphabetically", () => {
  const input = Object.freeze([
    project("legacy-z", "Zulu Legacy", undefined),
    project("company-001", "API as a Business Factory", "company:future:001"),
    project("company-083", "Domain / DNS / SSL Autopilot", "company:future:083"),
    project("legacy-a", "Alpha Legacy", undefined),
    project("company-013", "Competitive Intelligence Subscription", "company:future:013"),
    project("company-014", "Website Change Intelligence", "company:future:014"),
    project("company-107", "Rights, Royalties & Licensing Operations Platform", "company:future:107")
  ]);

  const expected = [
    "company-014",
    "company-013",
    "company-083",
    "company-001",
    "company-107",
    "legacy-a",
    "legacy-z"
  ];

  assert.deepEqual(filterRuntimeProjects(input, {}).map((item) => item.id), expected);
  assert.deepEqual(groupRuntimeProjects(input, "none")[0].projects.map((item) => item.id), expected);
  assert.deepEqual(groupRuntimeProjects(input, "lifecycle")[0].projects.map((item) => item.id), expected);
});
