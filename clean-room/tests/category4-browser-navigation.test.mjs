import test from "node:test";
import assert from "node:assert/strict";
import { BrowserNavigationCoordinator, browserLocationKey, readCommandCenterHistoryState } from "../dist/runtime/browser-navigation.js";

function harness(pathname = "/projects", search = "") {
  const location = { pathname, search };
  const stack = [];
  let index = -1;
  const scroll = {
    value: 0,
    restored: [],
    read() { return this.value; },
    restore(offset) { this.value = offset; this.restored.push(offset); }
  };
  const history = {
    state: null,
    length: 1,
    scrollRestoration: "auto",
    replaceCalls: [],
    pushCalls: [],
    backCalls: 0,
    replaceState(data, _unused, url) {
      this.state = data;
      this.replaceCalls.push({ data, url: String(url) });
      if (url) {
        const parsed = new URL(String(url), "https://command-center.test");
        location.pathname = parsed.pathname;
        location.search = parsed.search;
      }
      if (index < 0) { stack.push({ data, url: String(url) }); index = 0; }
      else stack[index] = { data, url: String(url) };
    },
    pushState(data, _unused, url) {
      this.state = data;
      this.pushCalls.push({ data, url: String(url) });
      const parsed = new URL(String(url), "https://command-center.test");
      location.pathname = parsed.pathname;
      location.search = parsed.search;
      stack.splice(index + 1);
      stack.push({ data, url: String(url) });
      index = stack.length - 1;
      this.length = stack.length;
    },
    back() {
      this.backCalls += 1;
      if (index > 0) {
        index -= 1;
        const entry = stack[index];
        this.state = entry.data;
        const parsed = new URL(entry.url, "https://command-center.test");
        location.pathname = parsed.pathname;
        location.search = parsed.search;
      }
    }
  };
  return { location, history, scroll, coordinator: new BrowserNavigationCoordinator(history, location, scroll) };
}

test("P4.3 initialization makes the shell the manual scroll-restoration owner", () => {
  const { coordinator, history, scroll } = harness("/projects", "?group=type");
  scroll.value = 420;
  const state = coordinator.initialize();
  assert.equal(history.scrollRestoration, "manual");
  assert.equal(state.locationKey, "/projects?group=type");
  assert.equal(state.scrollY, 420);
  assert.deepEqual(readCommandCenterHistoryState(history.state), state);
});

test("P4.3 navigation captures current scroll before push and starts the target at top", () => {
  const { coordinator, history, scroll } = harness("/projects", "");
  coordinator.initialize();
  scroll.value = 735;
  const target = coordinator.navigate("/project/project%3Aalpha");
  assert.equal(history.replaceCalls.at(-1).data.scrollY, 735);
  assert.equal(history.replaceCalls.at(-1).data.locationKey, "/projects");
  assert.equal(history.pushCalls.at(-1).url, "/project/project%3Aalpha");
  assert.equal(target.locationKey, "/project/project%3Aalpha");
  assert.equal(target.scrollY, 0);
  assert.equal(scroll.restored.at(-1), 0);
});

test("P4.3 back captures outgoing scroll and delegates to browser history when available", () => {
  const { coordinator, history, scroll, location } = harness("/projects", "");
  coordinator.initialize();
  coordinator.navigate("/project/project%3Aalpha");
  scroll.value = 311;
  assert.equal(coordinator.back("/"), "history");
  assert.equal(history.backCalls, 1);
  assert.equal(location.pathname, "/projects");
  assert.equal(readCommandCenterHistoryState(history.state)?.scrollY, 0);
});

test("P4.3 restoration only accepts matching Command Center history state", () => {
  const { coordinator, scroll, history } = harness("/projects", "?group=type");
  coordinator.initialize();
  const valid = { commandCenter: true, locationKey: "/projects?group=type", scrollY: 612, sequence: 4 };
  assert.equal(coordinator.restore(valid), 612);
  assert.equal(scroll.value, 612);
  assert.equal(coordinator.restore({ ...valid, locationKey: "/projects?group=company", scrollY: 999 }), 0);
  assert.equal(scroll.value, 0);
  assert.equal(coordinator.restore({ commandCenter: true, locationKey: "/projects?group=type", scrollY: -1, sequence: 5 }), 0);
  assert.equal(history.scrollRestoration, "manual");
});

test("P4.3 no-history fallback remains absolute and deterministic", () => {
  const { coordinator, history, location } = harness("/projects", "");
  coordinator.initialize();
  history.length = 1;
  assert.equal(coordinator.back("/"), "fallback");
  assert.equal(location.pathname, "/");
  assert.equal(history.pushCalls.at(-1).url, "/");
});

test("location keys preserve query state and malformed history state fails closed", () => {
  assert.equal(browserLocationKey({ pathname: "/projects", search: "?q=alpha" }), "/projects?q=alpha");
  assert.equal(readCommandCenterHistoryState({ commandCenter: true, locationKey: "projects", scrollY: 0, sequence: 0 }), undefined);
  assert.equal(readCommandCenterHistoryState({ commandCenter: true, locationKey: "/projects", scrollY: 0, sequence: 1.5 }), undefined);
});
