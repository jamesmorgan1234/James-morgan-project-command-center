import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

/**
 * Final whole-system rendered sweep.
 *
 * Serves the built browser artifact with SPA fallback, drives real Chrome over
 * CDP, and records per-route rendered evidence at phone and desktop viewports:
 * route resolution, rendered text, navigation, overflow, broken images, console
 * errors, uncaught exceptions, touch-target sizes and keyboard focusability.
 */
const ROOT = process.cwd();
const OUT = resolve(ROOT, "dist-web");
const EVIDENCE_DIR = resolve(ROOT, "evidence/whole-system-sweep");
const PORT = Number(process.env.SWEEP_PORT ?? 4191);
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTES = [
  ["/", "Command Center"],
  ["/projects", "Projects"],
  ["/active", "Active / Live"],
  ["/next-up", "Next Up"],
  ["/project/fixture-critical", "Project Details"],
  ["/project/fixture-normal", "Project Details"],
  ["/project/fixture-low", "Project Details"],
  ["/brain", "Brain"],
  ["/agency", "Agency"],
  ["/needs-me", "Needs Me"],
  ["/search", "Search"],
  ["/automations", "Automations"],
  ["/personal", "Personal"],
  ["/finance", "Finance"],
  ["/social", "Social & Communications"],
  ["/books", "Books"],
  ["/specialists", "Specialists"],
  ["/analytics", "Analytics"],
  ["/settings", "Settings"],
  ["/settings/security", "Security"],
  ["/settings/devices", "Devices"],
  ["/this-route-does-not-exist", null]
];
const VIEWPORTS = [
  { id: "phone", width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
  ...(process.env.SWEEP_PHONE_ONLY === "1" ? [] : [{ id: "desktop", width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }])
];

const CHROME = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", resolve(ROOT, "../.tools/chrome-headless-shell-linux64/chrome-headless-shell")].filter(Boolean).find((p) => existsSync(p));
if (!CHROME) throw new Error("No Chrome/Chromium binary available for the rendered sweep");
if (!existsSync(join(OUT, "index.html"))) throw new Error("dist-web is missing; build the browser artifact before the rendered sweep");

const server = spawn("python3", [resolve(ROOT, "scripts/serve-spa.py"), String(PORT), OUT], { stdio: ["ignore", "ignore", "pipe"] });
let serverLog = "";
server.stderr.on("data", (chunk) => { serverLog += String(chunk).slice(-2000); });

function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createNetServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolvePort(port));
    });
  });
}

class Cdp {
  #ws; #id = 0; #pending = new Map();
  static async open(url) { const client = new Cdp(url); await client.#opened; return client; }
  #opened;
  constructor(url) {
    this.#ws = new WebSocket(url);
    this.#opened = new Promise((res, rej) => {
      const timer = setTimeout(() => rej(new Error("CDP open timeout")), 10000);
      this.#ws.addEventListener("open", () => { clearTimeout(timer); res(); }, { once: true });
      this.#ws.addEventListener("error", () => { clearTimeout(timer); rej(new Error("CDP open failed")); }, { once: true });
    });
    this.#ws.addEventListener("message", (event) => {
      let message; try { message = JSON.parse(String(event.data)); } catch { return; }
      if (!message.id) { this.onEvent?.(message); return; }
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id); clearTimeout(pending.timer);
      message.error ? pending.reject(new Error(`CDP ${pending.method}: ${message.error.message}`)) : pending.resolve(message.result ?? {});
    });
  }
  onEvent;
  call(method, params = {}, timeoutMs = 20000) {
    const id = ++this.#id;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => { this.#pending.delete(id); rej(new Error(`CDP ${method} timeout`)); }, timeoutMs);
      this.#pending.set(id, { resolve: res, reject: rej, timer, method });
      this.#ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { try { this.#ws.close(); } catch {} }
}

async function evaluate(cdp, expression, timeoutMs = 20000) {
  const result = await cdp.call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, timeoutMs);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "evaluation failed");
  return result.result?.value;
}

const profile = mkdtempSync(join(tmpdir(), "cc-sweep-"));
const results = [];
let browser; let cdp;

try {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try { if ((await fetch(`${BASE}/index.html`, { cache: "no-store" })).ok) break; } catch {}
    await sleep(100);
  }
  const entryProbe = await fetch(`${BASE}/app/runtime/browser-entrypoint.js`);
  if (!entryProbe.ok || !/javascript/.test(entryProbe.headers.get("content-type") ?? "")) {
    throw new Error(`Sweep server cannot serve the app entrypoint: status=${entryProbe.status} type=${entryProbe.headers.get("content-type")}`);
  }
  const debugPort = await freePort();
  browser = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "pipe", "pipe"] });
  browser.stderr.on("data", (chunk) => { serverLog += String(chunk).slice(-2000); });

  let targets;
  for (let attempt = 0; attempt < 150; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      if (response.ok) {
        targets = await response.json();
        if (Array.isArray(targets) && targets.some((t) => t.type === "page" && t.webSocketDebuggerUrl)) break;
      }
    } catch {}
    await sleep(100);
  }
  const page = Array.isArray(targets) ? targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl) : undefined;
  if (!page) throw new Error(`No browser page target became available: ${serverLog}`);
  cdp = await Cdp.open(page.webSocketDebuggerUrl);
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Log.enable");
  await cdp.call("Network.enable");

  let consoleErrors = [];
  let pageErrors = [];
  let networkFailures = [];
  cdp.onEvent = (message) => {
    if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
      consoleErrors.push((message.params.args ?? []).map((a) => String(a.value ?? a.description ?? "")).join(" ").slice(0, 300));
    }
    if (message.method === "Runtime.exceptionThrown") pageErrors.push(String(message.params?.exceptionDetails?.text ?? "exception").slice(0, 300));
    if (message.method === "Log.entryAdded" && message.params?.entry?.level === "error") consoleErrors.push(String(message.params.entry.text ?? "").slice(0, 300));
    if (message.method === "Network.responseReceived") {
      const response = message.params?.response ?? {};
      const type = String(response.headers?.["content-type"] ?? response.mimeType ?? "");
      if (Number(response.status) >= 400 || (/octet-stream/.test(type) && /\.js/.test(String(response.url)))) {
        networkFailures.push(`${response.status} ${type} ${String(response.url).slice(0, 160)}`);
      }
    }
    if (message.method === "Network.loadingFailed") networkFailures.push(`failed ${String(message.params?.errorText ?? "")} ${String(message.params?.requestId ?? "")}`);
  };

  mkdirSync(EVIDENCE_DIR, { recursive: true });

  for (const viewport of VIEWPORTS) {
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.deviceScaleFactor, mobile: viewport.mobile });
    for (const [path, expectedTitle] of ROUTES) {
      consoleErrors = []; pageErrors = []; networkFailures = [];
      await cdp.call("Page.navigate", { url: `${BASE}${path}` }, 20000).catch(() => ({}));
      let observation = null;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        try {
          observation = await evaluate(cdp, `(() => {
            const app = document.querySelector("main, [data-app-root], #app, body");
            const text = (app?.innerText ?? document.body?.innerText ?? "").replace(/\\s+/g, " ").trim();
            const focusables = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled && el.getClientRects().length > 0);
            const smallTargets = focusables.filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 32 || r.height < 32); }).length;
            const brokenImages = [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src).slice(0, 5);
            const navLinks = [...document.querySelectorAll('nav a[href], [data-nav] a[href]')].map((a) => a.getAttribute("href"));
            return {
              ready: document.readyState,
              title: document.title,
              heading: (document.querySelector("h1")?.textContent ?? "").trim().slice(0, 80),
              textLength: text.length,
              snippet: text.slice(0, 240),
              focusableCount: focusables.length,
              smallTargetCount: smallTargets,
              brokenImages,
              navLinks,
              overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              hasAppShell: !!document.querySelector('meta[name="application-name"]'),
              notFoundSurface: /not found|unknown route|does not exist|unavailable/i.test(text.slice(0, 400)),
              placeholderMarkers: (text.match(/\\b(TODO|FIXME|PLACEHOLDER|lorem ipsum)\\b/gi) ?? []).slice(0, 5)
            };
          })()`);
          if (observation.ready === "complete" && observation.textLength > 0) break;
        } catch {}
        await sleep(100);
      }
      const screenshot = path === "/" ? await cdp.call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }).catch(() => null) : null;
      const slug = path === "/" ? "home" : path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
      const shotPath = join(EVIDENCE_DIR, `${viewport.id}-${slug}.png`);
      if (screenshot?.data) writeFileSync(shotPath, Buffer.from(screenshot.data, "base64"));
      results.push({
        viewport: viewport.id,
        path,
        expectedTitle,
        ...observation,
        consoleErrors: consoleErrors.slice(0, 5),
        pageErrors: pageErrors.slice(0, 5),
        networkFailures: networkFailures.slice(0, 5),
        screenshot: screenshot?.data ? `clean-room/evidence/whole-system-sweep/${viewport.id}-${slug}.png` : null,
        passed: Boolean(observation) && observation.ready === "complete" && observation.textLength > 40 && observation.overflowX <= 1 && observation.brokenImages.length === 0 && consoleErrors.length === 0 && pageErrors.length === 0
      });
    }
  }

  // Keyboard focus sweep on the home route.
  await cdp.call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.call("Page.navigate", { url: `${BASE}/` });
  await sleep(1200);
  const focusOrder = await evaluate(cdp, `(async () => {
    const seen = [];
    for (let i = 0; i < 12; i += 1) {
      const el = document.activeElement;
      if (el && el !== document.body) seen.push((el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40));
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", code: "Tab", keyCode: 9, bubbles: true }));
      await new Promise((r) => setTimeout(r, 40));
    }
    return seen;
  })()`);

  const failures = results.filter((entry) => !entry.passed);
  const unknown = results.find((entry) => entry.path === "/this-route-does-not-exist");
  const report = {
    schemaVersion: "cc-whole-system-rendered-sweep-v1",
    generatedAt: new Date().toISOString(),
    base: BASE,
    browser: CHROME,
    viewports: VIEWPORTS.map(({ id, width, height }) => ({ id, width, height })),
    routeCount: ROUTES.length,
    observationCount: results.length,
    failureCount: failures.length,
    unknownRouteHandledTruthfully: Boolean(unknown?.notFoundSurface),
    focusOrder,
    results
  };
  writeFileSync(resolve(ROOT, "evidence/WHOLE_SYSTEM_RENDERED_SWEEP.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ observationCount: results.length, failureCount: failures.length, failures: failures.map((f) => `${f.viewport}${f.path}:${f.overflowX}/${f.consoleErrors.length}/${f.pageErrors.length}/${f.textLength}`).slice(0, 12), unknownRouteHandledTruthfully: report.unknownRouteHandledTruthfully, focusOrder }, null, 2));
  if (failures.length) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  cdp?.close();
  if (browser && browser.exitCode === null) browser.kill("SIGKILL");
  if (server.exitCode === null) server.kill("SIGTERM");
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
