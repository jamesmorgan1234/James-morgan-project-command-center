import test from "node:test";
import assert from "node:assert/strict";
import { createCoreRouteRegistry, RouteRegistry } from "../dist/ui/routes.js";
import { listExplicitBrowserRouteKeys, resolveBrowserRoute } from "../dist/runtime/route-state.js";

const EXPECTED_KEYS = Object.freeze([
  "route:home",
  "route:projects",
  "route:active-live",
  "route:next-up",
  "route:project-detail",
  "route:brain",
  "route:agency",
  "route:needs-me",
  "route:search",
  "route:automations",
  "route:personal",
  "route:finance",
  "route:social",
  "route:books",
  "route:specialists",
  "route:analytics",
  "route:settings",
  "route:settings-security",
  "route:settings-devices"
]);

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

test("every declared core route has an explicit browser route state", () => {
  const routes = createCoreRouteRegistry();
  assert.deepEqual(routes.list().map((route) => route.key), EXPECTED_KEYS);
  assert.deepEqual(listExplicitBrowserRouteKeys(), EXPECTED_KEYS);
  for (const route of routes.list()) {
    const resolution = resolveBrowserRoute(routes, SAMPLE_PATHS[route.key]);
    assert.equal(resolution.state, "known", route.key);
    assert.equal(resolution.resolved.route.key, route.key);
  }
});

test("known routes never silently fall through to Home", () => {
  const routes = createCoreRouteRegistry();
  for (const [key, path] of Object.entries(SAMPLE_PATHS)) {
    const resolution = resolveBrowserRoute(routes, path);
    assert.equal(resolution.state, "known", key);
    if (key !== "route:home") assert.notEqual(resolution.resolved.route.key, "route:home", key);
  }
});

test("unknown and malformed paths fail safely and deterministically", () => {
  const routes = createCoreRouteRegistry();
  assert.deepEqual(resolveBrowserRoute(routes, "/not-a-command-center-route"), { state: "unknown", path: "/not-a-command-center-route" });
  assert.deepEqual(resolveBrowserRoute(routes, "/project/%E0%A4%A"), { state: "unknown", path: "/project/%E0%A4%A" });
  assert.equal(routes.resolve("/project/%E0%A4%A"), undefined);
});

test("a newly declared but unmapped route is blocked instead of using a generic surface", () => {
  const routes = new RouteRegistry();
  routes.register({ key: "route:future", path: "/future", title: "Future", moduleKey: "module:future", scrollOwner: "shell", backBehavior: "history" });
  assert.deepEqual(resolveBrowserRoute(routes, "/future"), { state: "unmapped-known", path: "/future", routeKey: "route:future" });
});
