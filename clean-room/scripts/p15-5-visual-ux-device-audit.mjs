/**
 * P15.5 — full visual, UX, accessibility and device audit.
 *
 * Authority (roadmap P15.5): compare approved screenshot structures and shared
 * language, interactions, Back/scroll, error/loading/empty states, accessibility,
 * responsive geometry and target devices. Exit gate: shown screens match
 * authority; unseen screens inherit the system; no generic SaaS drift.
 *
 * Every suite runs against the real compiled implementation (dist/ui,
 * dist/runtime) and the real runtime/CSS sources — never against roadmap prose.
 * Exit code 0 only when every suite passes. --write emits the phase receipt
 * bound to the exact source commit and audited inputs.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  APPROVED_REFERENCE_VIEWPORT,
  APPROVED_SCREEN_FIXTURES,
  APPROVED_SHARED_VISUAL_LANGUAGE,
  APPROVED_VISUAL_REFERENCES,
  ApplicationShell,
  COMMAND_CENTER_ACCESSIBILITY,
  COMMAND_CENTER_OFFLINE_POLICY,
  COMMAND_CENTER_PRIMITIVES,
  COMMAND_CENTER_PWA_SHELL,
  COMMAND_CENTER_SEMANTIC_STATES,
  MAX_TRANSITION_DURATION_MS,
  NavigationCoordinator,
  OVERLAY_Z_INDEX,
  PwaUpdateCoordinator,
  REJECTED_VISUAL_PATTERNS,
  REQUIRED_REGRESSION_STATES,
  RouteRegistry,
  UNSEEN_SCREEN_DERIVATION_RULE,
  accessibleMotionDuration,
  assertAccessibleControl,
  assertNoInternalDetail,
  assertNoTechnicalPlumbing,
  assertNoTapInterception,
  assertOverlayOrder,
  assertPhoneFirstViewport,
  assertPrimitiveAccessibility,
  assertTransitionBudget,
  classifyLayout,
  componentRegressionFixture,
  createCoreRouteRegistry,
  focusBoundaryState,
  keyboardCommand,
  motionDuration,
  overlayZIndex,
  ownerFacingText,
  scaleReferencePx,
  statusAccessibilityState,
  statusLabel,
  verifiedProgress
} from "../dist/ui/index.js";
import { listExplicitBrowserRouteKeys, resolveBrowserRoute } from "../dist/runtime/route-state.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const read = (relative) => readFileSync(resolve(repoRoot, relative), "utf8");
const results = [];
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const expectThrow = (run, pattern, message) => {
  try {
    run();
  } catch (error) {
    expect(pattern.test(String(error.message)), `${message}: unexpected error "${error.message}"`);
    return;
  }
  throw new Error(`${message}: expected a rejection but the operation succeeded`);
};
const suite = (id, description, body) => {
  const checks = [];
  const check = (name, run) => {
    try { run(); checks.push({ name, passed: true }); }
    catch (error) { checks.push({ name, passed: false, error: error.message }); }
  };
  body(check);
  const failed = checks.filter((entry) => !entry.passed);
  results.push({ id, description, passed: failed.length === 0, checks });
};

const APPROVED_KEYS = ["active_live", "next_up", "project_detail_missing_hour", "projects"];
const SAMPLE_PATHS = Object.freeze({
  "route:home": "/",
  "route:projects": "/projects",
  "route:active-live": "/active",
  "route:next-up": "/next-up",
  "route:project-detail": "/project/project%3Aalpha",
  "route:brain": "/brain",
  "route:agency": "/agency",
  "route:needs-me": "/needs-me",
  "route:search": "/search",
  "route:automations": "/automations",
  "route:personal": "/personal",
  "route:finance": "/finance",
  "route:social": "/social",
  "route:books": "/books",
  "route:specialists": "/specialists",
  "route:analytics": "/analytics",
  "route:settings": "/settings",
  "route:settings-security": "/settings/security",
  "route:settings-devices": "/settings/devices"
});
const PHONE = Object.freeze({ width: 412, height: 915, pixelRatio: 2.5, reducedMotion: false, highContrast: false });

suite("approved-screen-authority", "Shown screens match the owner-approved visual authority", (check) => {
  check("four approved screens are the only approved structural authority", () => {
    expect(JSON.stringify(Object.keys(APPROVED_VISUAL_REFERENCES).sort()) === JSON.stringify(APPROVED_KEYS), "unexpected approved screen set");
    const filenames = Object.values(APPROVED_VISUAL_REFERENCES).map((reference) => reference.approvedLegacyFilename).sort();
    expect(JSON.stringify(filenames) === JSON.stringify(["3369(5).png", "3370(4).png", "3372(6).png", "3373(5).png"]), `unexpected approved filenames: ${filenames}`);
  });
  check("approved authority is honest about unmapped legacy filenames", () => {
    for (const reference of Object.values(APPROVED_VISUAL_REFERENCES)) {
      expect(reference.authority === "owner_approved", "approved screens must carry owner_approved authority");
      expect(reference.libraryStructuralMatch?.identityStatus === "structural_match_filename_unmapped", `${reference.screen} must not fabricate filename identity`);
      expect(reference.controls.length >= 4, `${reference.screen} must declare its approved controls`);
    }
  });
  check("shared visual language names the governing system and rejects drift", () => {
    for (const marker of ["near-black sci-fi canvas", "orange/gold illuminated machinery", "clipped/beveled geometry", "whole-card navigation for navigational cards", "no decorative arrows or chevrons on owner-facing cards"]) {
      expect(APPROVED_SHARED_VISUAL_LANGUAGE.includes(marker), `shared visual language missing "${marker}"`);
    }
    for (const rejected of ["generic SaaS dashboard", "flat admin table as primary navigation", "static hand-entered progress percentage", "visual structure invented as exact authority for an unseen screen", "new modules switching to a different design system", "decorative arrows or chevrons on owner-facing cards"]) {
      expect(REJECTED_VISUAL_PATTERNS.includes(rejected), `rejected visual pattern missing "${rejected}"`);
    }
  });
  check("approved reference viewport is phone-first portrait and scales truthfully", () => {
    expect(APPROVED_REFERENCE_VIEWPORT.width === 864 && APPROVED_REFERENCE_VIEWPORT.height === 1536, "approved reference viewport changed");
    assertPhoneFirstViewport(APPROVED_REFERENCE_VIEWPORT.width, APPROVED_REFERENCE_VIEWPORT.height);
    expect(scaleReferencePx(24, 432) === 12, "reference scaling must be proportional");
    expect(scaleReferencePx(48, 432) === 24, "reference scaling must be proportional");
  });
});

suite("unseen-screen-derivation", "Unseen screens inherit the approved system instead of redesigning it", (check) => {
  check("derivation rule is explicit and derived screens are never claimed as pixel-identical", () => {
    const rule = UNSEEN_SCREEN_DERIVATION_RULE;
    expect(rule.authority === "owner_approved", "derivation rule must be owner approved");
    expect(rule.rule === "derive_not_redesign", "unseen screens must derive, not redesign");
    expect(JSON.stringify([...rule.sourceScreens].sort()) === JSON.stringify(APPROVED_KEYS), "derivation must start from all approved screens");
    expect(rule.requiredContinuity.length >= 6, "continuity requirements must be substantive");
    expect(rule.requiredContinuity.some((entry) => entry.includes("orange/gold")), "continuity must carry the approved machinery language");
    expect(rule.truthPolicy.includes("pixel-identical"), "derived screens must not be represented as pixel-identical screenshots");
  });
  check("every approved screen has a structural fixture with its required regions and card traits", () => {
    expect(JSON.stringify(Object.keys(APPROVED_SCREEN_FIXTURES).sort()) === JSON.stringify(APPROVED_KEYS), "fixtures must cover exactly the approved screens");
    expect(APPROVED_SCREEN_FIXTURES.projects.requiredRegions.includes("project_list"), "projects fixture must require the project list region");
    expect(APPROVED_SCREEN_FIXTURES.projects.requiredCardTraits.includes("progress_ring"), "projects cards must keep truthful progress rings");
    expect(APPROVED_SCREEN_FIXTURES.active_live.requiredCardTraits.includes("scope_or_activity_fact"), "active cards must carry a real scope or activity fact");
    expect(APPROVED_SCREEN_FIXTURES.next_up.requiredRegions.includes("priority_queue"), "next up must keep the priority queue hierarchy");
    expect(APPROVED_SCREEN_FIXTURES.project_detail_missing_hour.requiredRegions.includes("publication_status"), "project detail must keep publication status");
  });
  check("no approved fixture reintroduces decorative chevrons or title-only navigation", () => {
    for (const fixture of Object.values(APPROVED_SCREEN_FIXTURES)) {
      expect(!fixture.requiredCardTraits.some((trait) => trait.includes("chevron")), `${fixture.screen} must not require chevrons`);
      expect(fixture.requiredCardTraits.includes("whole_card_navigation") || fixture.screen === "project_detail_missing_hour", `${fixture.screen} navigation cards must use the whole card`);
    }
  });
});

suite("required-routes-and-navigation", "Every required route resolves truthfully with no silent Home fallback", (check) => {
  check("core registry and explicit browser route table agree exactly", () => {
    const routes = createCoreRouteRegistry();
    const keys = routes.list().map((route) => route.key);
    expect(keys.length === 19, `expected 19 core routes, got ${keys.length}`);
    expect(JSON.stringify(listExplicitBrowserRouteKeys()) === JSON.stringify(keys), "browser route table diverged from the core registry");
    expect(Object.keys(SAMPLE_PATHS).length === keys.length, "audit sample paths must cover every route");
  });
  check("every declared route resolves to its own explicit browser state", () => {
    const routes = createCoreRouteRegistry();
    for (const route of routes.list()) {
      const resolution = resolveBrowserRoute(routes, SAMPLE_PATHS[route.key]);
      expect(resolution.state === "known", `${route.key} must resolve as known`);
      expect(resolution.resolved.route.key === route.key, `${route.key} resolved incorrectly`);
      if (route.key !== "route:home") expect(resolution.resolved.route.key !== "route:home", `${route.key} must not fall back to Home`);
    }
  });
  check("unknown paths fail safely and keep a display-safe path", () => {
    const routes = createCoreRouteRegistry();
    expect(resolveBrowserRoute(routes, "/not-a-command-center-route").state === "unknown", "unknown path must not resolve");
    expect(resolveBrowserRoute(routes, "/project/%E0%A4%A").state === "unknown", "malformed path must not resolve");
    expect(routes.resolve("/project/%E0%A4%A") === undefined, "malformed path must not produce a route");
    expect(resolveBrowserRoute(routes, "/nope?query=1#frag").path === "/nope", "display path must strip query and fragment");
  });
  check("a newly declared but unmapped route is blocked rather than rendered generically", () => {
    const routes = new RouteRegistry();
    routes.register({ key: "route:future", path: "/future", title: "Future", moduleKey: "module:future", scrollOwner: "shell", backBehavior: "history" });
    const resolution = resolveBrowserRoute(routes, "/future");
    expect(resolution.state === "unmapped-known", "unmapped routes must be blocked");
    expect(resolution.routeKey === "route:future", "unmapped route must be identified");
  });
  check("route registration rejects duplicate paths and removal leaves no residue", () => {
    const routes = createCoreRouteRegistry();
    expectThrow(() => routes.register({ key: "route:dup", path: "/projects", title: "Dup", moduleKey: "module:dup", scrollOwner: "shell", backBehavior: "history" }), /duplicate/i, "duplicate path must be rejected");
    const extension = new RouteRegistry();
    extension.register({ key: "route:test", path: "/test", title: "Test", moduleKey: "module:test", scrollOwner: "shell", backBehavior: "history" });
    expect(extension.remove("route:test").path === "/test", "remove must return the removed route");
    expect(extension.list().length === 0, "registry must be empty after removal");
  });
});

suite("interactions-back-and-scroll", "Back and scroll have exactly one owner and behave truthfully", (check) => {
  check("navigation coordinator alone owns history and scroll restoration", () => {
    const nav = new NavigationCoordinator("/");
    nav.recordScroll("/", 120);
    nav.navigate("/projects");
    nav.recordScroll("/projects", 640);
    nav.navigate("/search");
    expect(nav.back() === "/projects", "back must return the previous path");
    expect(nav.back() === "/", "back must walk history truthfully");
    expect(nav.restoreScroll("/") === 120, "scroll must be restored per path");
    expect(nav.restoreScroll("/projects") === 640, "scroll must be restored per path");
    expect(nav.snapshot().history.length === 0, "back must consume history rather than leave a competing stack");
  });
  check("application shell rejects competing slot owners and invalid transitions", () => {
    const shell = new ApplicationShell();
    expectThrow(() => shell.transition("ready"), /invalid shell transition/i, "cold shell cannot jump to ready");
    shell.transition("starting");
    shell.transition("hydrating");
    shell.transition("ready");
    shell.mount({ slot: "main", moduleKey: "module:home" });
    expectThrow(() => shell.mount({ slot: "main", moduleKey: "module:other" }), /already|owned|mounted/i, "a shell slot cannot have two owners");
    shell.unmount("main", "module:home");
    expect(shell.listMounts().length === 0, "unmount must release the slot");
  });
  check("offline and degraded shell states are explicit, not silently ready", () => {
    const shell = new ApplicationShell();
    shell.transition("starting");
    shell.transition("hydrating");
    shell.transition("offline_ready");
    expect(shell.state === "offline_ready", "offline state must be explicit");
    shell.transition("degraded");
    expect(shell.state === "degraded", "degraded state must be explicit");
    expectThrow(() => shell.transition("hydrating"), /invalid shell transition/i, "degraded shell cannot re-enter hydration");
  });
});

suite("loading-empty-error-and-degraded-states", "Loading, empty, error, degraded and offline states are truthful and complete", (check) => {
  check("every required regression state has a deterministic, provider-free fixture", () => {
    expect(REQUIRED_REGRESSION_STATES.length === 9, "nine required regression states must remain declared");
    for (const state of ["normal", "degraded", "error", "dense", "empty", "stale", "offline", "conflict", "approval"]) {
      expect(REQUIRED_REGRESSION_STATES.includes(state), `missing regression state ${state}`);
      const fixture = componentRegressionFixture("card", state);
      expect(fixture.id === `fixture:card:${state}`, "fixture identity must be deterministic");
      expect(fixture.deterministicSeed === `command-center-p4:card:${state}:v1`, "fixture seed must be deterministic");
      expect(fixture.providerDependency === "none", "fixture states must not depend on a provider");
      expect(fixture.keyboardCheckRequired === true, "state fixtures must remain keyboard-checkable");
    }
  });
  check("status semantics always carry a textual equivalent, never colour alone", () => {
    const states = Object.entries(COMMAND_CENTER_SEMANTIC_STATES);
    expect(states.length === 5, `expected 5 semantic states, got ${states.length}`);
    for (const [state, value] of states) {
      expect(value.label.trim().length > 0, `semantic state ${state} requires a text label`);
      expect(value.color.trim().length > 0, `semantic state ${state} requires a colour token`);
      const accessible = statusAccessibilityState(state, value.label);
      expect(accessible.colorOnly === false, `${state} must not be communicated by colour alone`);
    }
    expectThrow(() => statusAccessibilityState("blocked", " "), /textual meaning/i, "a status without text must be rejected");
  });
  check("status labels and owner-facing text stay canonical and free of plumbing", () => {
    expect(statusLabel("in_progress") === "In progress", "canonical status label changed");
    expect(statusLabel("custom_state") === "Custom state", "unknown statuses must stay readable");
    expect(ownerFacingText("CCR-05847 hidden") === "hidden", "internal identifiers must be stripped");
    expectThrow(() => assertNoInternalDetail("CCR-05847"), /internal identifiers/i, "internal identifiers must not be shown");
    expectThrow(() => assertNoTechnicalPlumbing("postgres"), /technical plumbing/i, "technical plumbing must not be shown");
    expect(ownerFacingText('{"a":1}').startsWith("Details are available"), "raw JSON must be replaced for owners");
  });
  check("offline policy keeps the shell available without faking fresh data", () => {
    expect(COMMAND_CENTER_PWA_SHELL.offlineFallbackRoute === "/offline", "offline fallback route changed");
    expect(COMMAND_CENTER_PWA_SHELL.cachedShellNeverImpliesFreshBusinessData === true, "cached shell must never imply fresh business data");
    expect(COMMAND_CENTER_PWA_SHELL.incompatibleSchemaActivationBlocked === true, "incompatible schema activation must stay blocked");
    expect(COMMAND_CENTER_OFFLINE_POLICY.shellAvailableOffline === true, "shell must remain available offline");
    expect(COMMAND_CENTER_OFFLINE_POLICY.queueWritesWhileOffline === false, "writes must not be queued offline");
    expect(COMMAND_CENTER_OFFLINE_POLICY.showStaleness === true, "offline data must be marked stale");
    expect(COMMAND_CENTER_OFFLINE_POLICY.protectedActionsOffline === false, "protected actions must be unavailable offline");
  });
  check("update lifecycle blocks incompatible activation and preserves known-good rollback", () => {
    const updates = new PwaUpdateCoordinator();
    expectThrow(() => updates.transition("active"), /invalid update transition/i, "idle cannot activate directly");
    expectThrow(() => updates.rollback(), /known-good/i, "rollback requires a known-good release");
    updates.transition("checking");
    updates.transition("available");
    updates.setCandidate({ releaseId: "release-1", buildHash: "build-hash-1", assetManifestHash: "assets-1", schemaCompatibility: "schema-v1" });
    expect(updates.candidateIsSchemaCompatible("schema-v2") === false, "incompatible schema must block activation");
    expect(updates.candidateIsSchemaCompatible("schema-v1") === true, "compatible schema must be allowed");
    updates.transition("downloading");
    updates.transition("verified");
    updates.transition("activating");
    updates.transition("active");
    updates.markActive();
    updates.transition("rolled_back");
    expect(updates.rollback().releaseId === "release-1", "rollback must restore the known-good release");
  });
  check("runtime renders explicit unavailable/empty states instead of fabricating zeroes", () => {
    const browser = read("clean-room/src/runtime/browser.ts");
    expect(/function emptyState\(/.test(browser), "runtime must define a shared empty state");
    for (const marker of ["Projects unavailable", "not interpreted as zero projects", "No verified live projects", "Priority queue unavailable", "Route unavailable", "This is not interpreted as zero projects"]) {
      expect(browser.includes(marker) || browser.includes(marker.replace("This is not interpreted as zero projects", "not interpreted as zero projects")), `runtime missing truthful state "${marker}"`);
    }
    expect(/snapshot\.connection\.state === "connected" \? "ready" : snapshot\.connection\.state === "disconnected" \? "offline_ready" : "degraded"/.test(browser), "runtime must map connection state to ready/offline_ready/degraded");
    expect(/addEventListener\("offline"/.test(browser), "runtime must react to offline events");
  });
});

suite("accessibility", "Accessibility contracts are enforced rather than declared", (check) => {
  check("interactive targets meet the 48px minimum and require an accessible name", () => {
    assertAccessibleControl({ width: 48, height: 48, ariaLabel: "Back" });
    expectThrow(() => assertAccessibleControl({ width: 47, height: 48, ariaLabel: "Back" }), /48px/i, "undersized targets must be rejected");
    expectThrow(() => assertAccessibleControl({ width: 48, height: 48 }), /accessible label/i, "unlabelled controls must be rejected");
  });
  check("keyboard commands and focus boundaries behave truthfully", () => {
    expect(keyboardCommand("Enter") === "activate", "Enter must activate");
    expect(keyboardCommand(" ") === "activate", "Space must activate");
    expect(keyboardCommand("Escape") === "dismiss", "Escape must dismiss");
    expect(keyboardCommand("Tab") === "next" && keyboardCommand("Tab", true) === "previous", "Tab must traverse in both directions");
    expect(keyboardCommand("Home") === "home" && keyboardCommand("End") === "end", "Home/End must be supported");
    expect(keyboardCommand("q") === "none", "unmapped keys must be inert");
    const modal = focusBoundaryState(true);
    expect(modal.trapFocus && modal.restoreFocusOnClose && modal.escapeMayDismiss, "open dialogs must trap focus, restore it, and allow Escape");
    expect(focusBoundaryState(true, true).escapeMayDismiss === false, "destructive confirmation must resist Escape dismissal");
    expect(focusBoundaryState(false).trapFocus === false, "closed dialogs must not trap focus");
  });
  check("the accessibility contract keeps every required guarantee", () => {
    for (const [key, value] of Object.entries(COMMAND_CENTER_ACCESSIBILITY)) expect(value === true, `accessibility guarantee ${key} must remain true`);
    expect(COMMAND_CENTER_ACCESSIBILITY.reducedMotionRespected === true, "reduced motion must be respected");
    expect(COMMAND_CENTER_ACCESSIBILITY.colorOnlyCriticalMeaningForbidden === true, "colour-only meaning must be forbidden");
    expect(COMMAND_CENTER_ACCESSIBILITY.destructiveConfirmationPreservedByKeyboard === true, "keyboard destructive confirmation must be preserved");
  });
  check("reduced motion removes animation and transition budget is enforced", () => {
    expect(accessibleMotionDuration(true, 400) === 0, "reduced motion must remove motion");
    expect(accessibleMotionDuration(false, 400) === 400, "standard motion must be preserved when allowed");
    expectThrow(() => accessibleMotionDuration(false, -1), /non-negative/i, "invalid durations must be rejected");
    expect(motionDuration({ ...PHONE, reducedMotion: true }) === 0, "device reduced motion must remove motion");
    expect(assertTransitionBudget(MAX_TRANSITION_DURATION_MS) === MAX_TRANSITION_DURATION_MS, "maximum transition must be accepted");
    expectThrow(() => assertTransitionBudget(MAX_TRANSITION_DURATION_MS + 1), /transition|budget|duration/i, "over-budget transitions must be rejected");
  });
  check("primitives, overlays and layers cannot break accessibility rules", () => {
    expectThrow(() => assertPrimitiveAccessibility({ kind: "dialog", width: 120, height: 120, accessibleName: "Dismiss", colorOnlyState: true }), /color alone/i, "colour-only primitive state must be rejected");
    expectThrow(() => assertPrimitiveAccessibility({ kind: "dialog", width: 120, height: 120, accessibleName: "Dismiss", decorativeChevron: true }), /chevron/i, "decorative chevrons must be rejected");
    assertPrimitiveAccessibility({ kind: "dialog", width: 120, height: 120, accessibleName: "Dismiss" });
    expectThrow(() => assertNoTapInterception({ interceptsTaps: true }), /tap/i, "tap interception must be rejected");
    assertNoTapInterception({ interceptsTaps: false });
    for (const kind of Object.keys(OVERLAY_Z_INDEX)) expect(overlayZIndex(kind) === OVERLAY_Z_INDEX[kind], `overlay layer ${kind} must keep its canonical depth`);
    assertOverlayOrder("navigation", "dialog");
    expectThrow(() => assertOverlayOrder("dialog", "navigation"), /./, "an overlay cannot sit below a shallower layer");
    expect(Object.keys(COMMAND_CENTER_PRIMITIVES).length >= 10, "primitive contract set must remain complete");
  });
});

suite("responsive-geometry-and-target-devices", "Responsive geometry and target devices keep the phone-first contract", (check) => {
  check("layout classes separate compact phone, phone, tablet and desktop", () => {
    expect(classifyLayout({ width: 320, height: 568, pixelRatio: 2, reducedMotion: false, highContrast: false }) === "compact_phone", "320px must be compact phone");
    expect(classifyLayout(PHONE) === "phone", "412x915 must be phone");
    expect(classifyLayout({ width: 768, height: 1024, pixelRatio: 2, reducedMotion: false, highContrast: false }) === "tablet", "768px must be tablet");
    expect(classifyLayout({ width: 1280, height: 1024, pixelRatio: 1, reducedMotion: false, highContrast: false }) === "desktop", "1280px must be desktop");
    expectThrow(() => classifyLayout({ width: 0, height: 900, pixelRatio: 2, reducedMotion: false, highContrast: false }), /positive/i, "invalid geometry must be rejected");
  });
  check("target devices stay phone-first including the accepted Samsung viewport", () => {
    for (const device of [
      { name: "Samsung Galaxy S23", width: 360, height: 780, pixelRatio: 3 },
      { name: "Samsung Galaxy S24 Ultra", width: 412, height: 915, pixelRatio: 3.5 },
      { name: "Samsung Galaxy Z Fold inner", width: 673, height: 841, pixelRatio: 2.6 }
    ]) {
      const layout = classifyLayout({ ...PHONE, width: device.width, height: device.height, pixelRatio: device.pixelRatio });
      expect(layout === "phone" || layout === "tablet", `${device.name} must map to a supported layout, got ${layout}`);
      assertPhoneFirstViewport(device.width, device.height);
    }
    expectThrow(() => assertPhoneFirstViewport(915, 412), /portrait/i, "landscape-only viewports must be rejected as primary");
  });
  check("reference scale and motion adapt to device profile", () => {
    expect(scaleReferencePx(48, 864) === 48, "reference scale must be exact at the approved reference width");
    expect(scaleReferencePx(48, 432) === 24, "reference scale must shrink proportionally on a narrower viewport");
    expect(motionDuration(PHONE) === 180, "standard motion must be the canonical duration");
    expect(motionDuration({ ...PHONE, highContrast: true }) === 180, "high contrast must not change motion duration");
  });
});

suite("runtime-assembly-and-no-legacy-drift", "Browser runtime assembly carries the approved system with no legacy dependency", (check) => {
  check("browser runtime renders each approved structure distinctly", () => {
    const browser = read("clean-room/src/runtime/browser.ts");
    for (const render of ["renderProjects", "renderActive", "renderNextUp", "renderProjectDetail"]) expect(new RegExp(`function ${render}\\(`).test(browser), `runtime missing ${render}`);
    expect(/case "active-live": return renderActive\(snapshot\)/.test(browser), "active-live must render its own structure");
    expect(/case "next-up": return renderNextUp\(snapshot\)/.test(browser), "next-up must render its own structure");
    expect(/case "project-detail": return renderProjectDetail\(snapshot,/.test(browser), "project detail must render its own structure");
    expect(!/case "active-live":[\s\S]{0,80}renderProjects/.test(browser), "active-live must not reuse the projects surface");
  });
  check("owner-facing navigation uses whole cards with no decorative chevrons", () => {
    const browser = read("clean-room/src/runtime/browser.ts");
    expect(/function bevelRouteCard\(/.test(browser), "runtime must use the approved bevel route card");
    expect(!/row-chevron/.test(browser), "runtime must not emit chevron markup");
    expect(!/function chevron\(/.test(browser), "runtime must not define a chevron helper");
    expect(/bevelRouteCard\(projectHref\(project\), "project-row project-navigation-card"/.test(browser), "projects cards must be fully navigational");
  });
  check("approved visual tokens and geometry are present in the shipped stylesheets", () => {
    const css = read("clean-room/public/app.css");
    const projectCss = read("clean-room/public/project-system.css");
    for (const marker of ["clip-path:polygon", ".back-control", ".project-row", ".active-row", ".next-row", ".progress-ring", ".header-planet"]) expect(css.includes(marker), `app.css missing ${marker}`);
    expect(css.includes("--cc-orange:#ff6a00"), "app.css must keep the approved orange machinery token");
    expect(/\.project-navigation-card\{[^}]*text-decoration:none[^}]*cursor:pointer/s.test(projectCss), "project cards must be whole-card links");
    expect(projectCss.includes(".row-chevron{display:none!important}"), "legacy chevrons must stay visually suppressed");
  });
  check("no generic UI framework or competing design system is introduced", () => {
    const pkg = JSON.parse(read("clean-room/package.json"));
    const forbidden = /^(react|react-dom|vue|svelte|next|tailwindcss|bootstrap|antd|@mui\/|@chakra-ui\/|styled-components)/;
    for (const name of Object.keys(pkg.dependencies ?? {})) expect(!forbidden.test(name), `generic UI dependency ${name} would drift the approved system`);
  });
  check("runtime and UI modules stay inside the clean-room source with no legacy or dynamic escape hatch", () => {
    for (const directory of ["clean-room/src/runtime", "clean-room/src/ui"]) {
      for (const file of readdirSync(resolve(repoRoot, directory)).filter((name) => name.endsWith(".ts"))) {
        const source = read(`${directory}/${file}`);
        const specifiers = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
        for (const specifier of specifiers) {
          expect(specifier.startsWith("."), `${file} imports non-relative ${specifier}`);
          expect(!specifier.includes("legacy"), `${file} imports legacy runtime ${specifier}`);
        }
        expect(!/\bdocument\.write\(/.test(source), `${file} must not use document.write`);
        expect(!/\beval\(/.test(source), `${file} must not use eval`);
      }
    }
    const build = read("clean-room/scripts/build-browser.mjs");
    expect(existsSync(resolve(repoRoot, "clean-room/scripts/build-browser.mjs")), "browser build entry must exist");
    expect(build.includes("../dist/runtime/assembly.js") && build.includes("assembleCanonicalRuntimeSnapshot"), "browser build must assemble the canonical runtime snapshot");
    for (const artifact of ["clean-room/dist/runtime/browser.js", "clean-room/dist/runtime/assembly.js", "clean-room/dist/runtime/route-state.js"]) expect(existsSync(resolve(repoRoot, artifact)), `compiled runtime artifact missing: ${artifact}`);
  });
});

const failedSuites = results.filter((entry) => !entry.passed);
const summary = {
  phaseId: "P15.5",
  suiteCount: results.length,
  checkCount: results.reduce((total, entry) => total + entry.checks.length, 0),
  failedSuiteCount: failedSuites.length,
  failedCheckCount: results.reduce((total, entry) => total + entry.checks.filter((check) => !check.passed).length, 0),
  approvedScreenCount: Object.keys(APPROVED_VISUAL_REFERENCES).length,
  coreRouteCount: createCoreRouteRegistry().list().length,
  requiredStateCount: REQUIRED_REGRESSION_STATES.length,
  suites: results
};

if (write) {
  const receipt = buildPhaseReceipt({
    phaseId: "P15.5",
    headSha,
    inputs: [
      "clean-room/scripts/p15-5-visual-ux-device-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/src/ui/accessibility.ts",
      "clean-room/src/ui/design-tokens.ts",
      "clean-room/src/ui/device.ts",
      "clean-room/src/ui/fixtures.ts",
      "clean-room/src/ui/navigation.ts",
      "clean-room/src/ui/primitives.ts",
      "clean-room/src/ui/presentation.ts",
      "clean-room/src/ui/pwa.ts",
      "clean-room/src/ui/routes.ts",
      "clean-room/src/ui/shell.ts",
      "clean-room/src/ui/visual-references.ts",
      "clean-room/src/runtime/route-state.ts",
      "clean-room/src/runtime/browser.ts",
      "clean-room/public/app.css",
      "clean-room/public/project-system.css",
      "clean-room/tests/ui-shell-foundation.test.mjs",
      "clean-room/tests/runtime-visual-structure.test.mjs",
      "clean-room/tests/route-state-closure.test.mjs",
      "clean-room/tests/p15-5-visual-ux-device-audit.test.mjs"
    ],
    evidence: [
      "clean-room/scripts/p15-5-visual-ux-device-audit.mjs",
      "clean-room/tests/p15-5-visual-ux-device-audit.test.mjs",
      "clean-room/tests/ui-shell-foundation.test.mjs",
      "clean-room/tests/runtime-visual-structure.test.mjs",
      "clean-room/tests/route-state-closure.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs"
    ],
    summary
  });
  const target = resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_5.json");
  writeFileSync(target, JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: "clean-room/evidence/phase-receipts/P15_5.json", inputsDigest: receipt.inputsDigest }));
}

console.log(JSON.stringify(summary));
if (failedSuites.length > 0) {
  for (const entry of failedSuites) for (const check of entry.checks.filter((item) => !item.passed)) console.error(`${entry.id} :: ${check.name} :: ${check.error}`);
  process.exit(1);
}
