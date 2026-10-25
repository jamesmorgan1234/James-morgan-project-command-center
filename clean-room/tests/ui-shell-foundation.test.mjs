import test from "node:test";
import assert from "node:assert/strict";
import {
  APPROVED_REFERENCE_VIEWPORT,
  APPROVED_VISUAL_REFERENCES,
  APPROVED_SHARED_VISUAL_LANGUAGE,
  UNSEEN_SCREEN_DERIVATION_RULE,
  REJECTED_VISUAL_PATTERNS,
  scaleReferencePx,
  createCoreRouteRegistry,
  RouteRegistry,
  NavigationCoordinator,
  ApplicationShell,
  verifiedProgress,
  createHomeGrid,
  PwaUpdateCoordinator,
  COMMAND_CENTER_OFFLINE_POLICY,
  classifyLayout,
  assertAccessibleControl,
  motionDuration,
  APPROVED_SCREEN_FIXTURES
} from "../dist/ui/index.js";

test("approved visual authority is explicit without pretending legacy filename identity is mapped", () => {
  assert.deepEqual(Object.values(APPROVED_VISUAL_REFERENCES).map((ref) => ref.approvedLegacyFilename).sort(), ["3369(5).png", "3370(4).png", "3372(6).png", "3373(5).png"]);
  for (const reference of Object.values(APPROVED_VISUAL_REFERENCES)) {
    assert.equal(reference.authority, "owner_approved");
    assert.equal(reference.libraryStructuralMatch.identityStatus, "structural_match_filename_unmapped");
  }
  assert.ok(APPROVED_SHARED_VISUAL_LANGUAGE.includes("near-black sci-fi canvas"));
  assert.ok(APPROVED_SHARED_VISUAL_LANGUAGE.includes("whole-card navigation for navigational cards"));
  assert.ok(REJECTED_VISUAL_PATTERNS.includes("generic SaaS dashboard"));
  assert.ok(REJECTED_VISUAL_PATTERNS.includes("decorative arrows or chevrons on owner-facing cards"));
  assert.equal(APPROVED_REFERENCE_VIEWPORT.width, 864);
  assert.equal(APPROVED_REFERENCE_VIEWPORT.height, 1536);
  assert.equal(scaleReferencePx(48, 432), 24);
});

test("unseen screens derive from the four approved screens instead of switching design systems", () => {
  assert.equal(UNSEEN_SCREEN_DERIVATION_RULE.authority, "owner_approved");
  assert.equal(UNSEEN_SCREEN_DERIVATION_RULE.rule, "derive_not_redesign");
  assert.deepEqual([...UNSEEN_SCREEN_DERIVATION_RULE.sourceScreens].sort(), ["active_live", "next_up", "project_detail_missing_hour", "projects"]);
  assert.ok(UNSEEN_SCREEN_DERIVATION_RULE.requiredContinuity.some((rule) => rule.includes("orange/gold")));
  assert.ok(UNSEEN_SCREEN_DERIVATION_RULE.requiredContinuity.some((rule) => rule.includes("new controls")));
  assert.ok(UNSEEN_SCREEN_DERIVATION_RULE.requiredContinuity.some((rule) => rule.includes("full card")));
  assert.ok(REJECTED_VISUAL_PATTERNS.includes("new modules switching to a different design system"));
});

test("route registry has one owner per path and supports add/remove without core rewrite", () => {
  const routes = createCoreRouteRegistry();
  assert.equal(routes.resolvePath("/projects").key, "route:projects");
  assert.throws(() => routes.register({ key: "route:duplicate", path: "/projects", title: "Bad", moduleKey: "module:test", scrollOwner: "shell", backBehavior: "history" }));
  const extension = new RouteRegistry();
  extension.register({ key: "route:test", path: "/test", title: "Test", moduleKey: "module:test", scrollOwner: "shell", backBehavior: "history" });
  assert.equal(extension.remove("route:test").path, "/test");
  assert.equal(extension.list().length, 0);
});

test("navigation coordinator is the single history and scroll owner", () => {
  const nav = new NavigationCoordinator("/");
  nav.recordScroll("/", 120);
  nav.navigate("/projects");
  nav.recordScroll("/projects", 640);
  assert.equal(nav.back(), "/");
  assert.equal(nav.restoreScroll("/"), 120);
  assert.equal(nav.snapshot().history.length, 0);
});

test("application shell rejects competing owners for a shell slot", () => {
  const shell = new ApplicationShell();
  shell.transition("starting");
  shell.transition("hydrating");
  shell.transition("ready");
  shell.mount({ slot: "main", moduleKey: "module:home" });
  assert.throws(() => shell.mount({ slot: "main", moduleKey: "module:other" }));
  shell.unmount("main", "module:home");
  assert.equal(shell.listMounts().length, 0);
});

test("progress never invents percentages when denominator is unverified or unknown", () => {
  assert.deepEqual(verifiedProgress(8, undefined, false), { kind: "na", label: "N/A", reason: "unverified_or_unknown_denominator" });
  assert.deepEqual(verifiedProgress(3, 5, true), { kind: "percent", completed: 3, total: 5, percent: 60 });
  assert.equal(verifiedProgress(6, 5, true).kind, "na");
});

test("Home primary modules keep one-column equal-card hierarchy", () => {
  const grid = createHomeGrid([
    { key: "projects", title: "Projects", route: "/projects", verifiedCount: 29, supportingText: "Open full portfolio" },
    { key: "active_live", title: "Active / Live", route: "/active", supportingText: "Open active projects" },
    { key: "next_up", title: "Next Up", route: "/next-up", supportingText: "Open priority queue" },
    { key: "owner_attention", title: "Needs Me", route: "/needs-me", supportingText: "Open owner boundaries" }
  ]);
  assert.equal(grid.columns, 1);
  assert.equal(grid.equalCardHeight, true);
  assert.equal(grid.modules.length, 4);
});

test("PWA update lifecycle requires immutable candidate identity and preserves known-good rollback", () => {
  const updates = new PwaUpdateCoordinator();
  updates.transition("checking");
  updates.transition("available");
  updates.setCandidate({ releaseId: "release-1", buildHash: "build-hash-1", assetManifestHash: "assets-1", schemaCompatibility: "schema-v1" });
  updates.transition("downloading");
  updates.transition("verified");
  updates.transition("activating");
  updates.transition("active");
  updates.markActive();
  updates.transition("rolled_back");
  assert.equal(updates.rollback().releaseId, "release-1");
  assert.equal(COMMAND_CENTER_OFFLINE_POLICY.protectedActionsOffline, false);
});

test("device adaptation remains phone-first and accessibility fail-closed", () => {
  assert.equal(classifyLayout({ width: 412, height: 915, pixelRatio: 2.5, reducedMotion: false, highContrast: false }), "phone");
  assert.doesNotThrow(() => assertAccessibleControl({ width: 48, height: 48, ariaLabel: "Back" }));
  assert.throws(() => assertAccessibleControl({ width: 32, height: 32, ariaLabel: "Back" }));
  assert.equal(motionDuration({ width: 412, height: 915, pixelRatio: 2.5, reducedMotion: true, highContrast: false }), 0);
});

test("visual fixtures preserve approved structures under the current owner card rules", () => {
  assert.ok(APPROVED_SCREEN_FIXTURES.projects.requiredCardTraits.includes("progress_ring"));
  assert.ok(APPROVED_SCREEN_FIXTURES.projects.requiredCardTraits.includes("whole_card_navigation"));
  assert.ok(APPROVED_SCREEN_FIXTURES.active_live.requiredCardTraits.includes("scope_or_activity_fact"));
  assert.ok(APPROVED_SCREEN_FIXTURES.active_live.requiredCardTraits.includes("whole_card_navigation"));
  assert.ok(APPROVED_SCREEN_FIXTURES.next_up.requiredRegions.includes("priority_queue"));
  assert.ok(APPROVED_SCREEN_FIXTURES.next_up.requiredCardTraits.includes("whole_card_navigation"));
  for (const fixture of Object.values(APPROVED_SCREEN_FIXTURES)) {
    assert.equal(fixture.requiredCardTraits.some((trait) => trait.includes("chevron")), false);
  }
  assert.ok(APPROVED_SCREEN_FIXTURES.project_detail_missing_hour.requiredRegions.includes("publication_status"));
});
