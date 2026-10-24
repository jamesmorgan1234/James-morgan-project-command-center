import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const root = process.cwd();
const dist = resolve(root, "dist-web");
const swPath = resolve(dist, "sw.js");
if (!existsSync(dist) || !existsSync(swPath)) throw new Error("dist-web/sw.js is missing; run npm run build first");

const chromeCandidates = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean);
const chrome = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chrome) throw new Error("No Chrome/Chromium binary is available for P15.14 lifecycle acceptance");

const port = Number(process.env.CATEGORY15_PWA_PORT ?? 4187);
const base = `http://127.0.0.1:${port}`;
const profile = mkdtempSync(join(tmpdir(), "cc-p15-chrome-"));
const originalSw = readFileSync(swPath, "utf8");
let server;
let browser;
let cdp;
let serverLog = "";
let chromeLog = "";

function appendLog(target, chunk) {
  const value = String(chunk);
  if (target === "server") serverLog = `${serverLog}${value}`.slice(-24000);
  else chromeLog = `${chromeLog}${value}`.slice(-24000);
}

async function startServer() {
  if (server) return;
  serverLog = "";
  server = spawn("python3", ["-m", "http.server", String(port), "--directory", dist], { stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => appendLog("server", chunk));
  server.stderr.on("data", (chunk) => appendLog("server", chunk));
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`P15 PWA test server exited before readiness\n${serverLog}`);
    try {
      const response = await fetch(`${base}/index.html`, { cache: "no-store" });
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error(`P15 PWA test server did not become ready\n${serverLog}`);
}

async function stopServer() {
  if (!server) return;
  const current = server;
  server = undefined;
  if (current.exitCode === null) current.kill("SIGTERM");
  await Promise.race([new Promise((resolvePromise) => current.once("exit", resolvePromise)), sleep(3000)]);
  if (current.exitCode === null) {
    current.kill("SIGKILL");
    await Promise.race([new Promise((resolvePromise) => current.once("exit", resolvePromise)), sleep(2000)]);
  }
}

async function stopBrowser() {
  if (!browser) return;
  const current = browser;
  browser = undefined;
  if (current.exitCode === null) current.kill("SIGTERM");
  await Promise.race([new Promise((resolvePromise) => current.once("exit", resolvePromise)), sleep(4000)]);
  if (current.exitCode === null) {
    current.kill("SIGKILL");
    await Promise.race([new Promise((resolvePromise) => current.once("exit", resolvePromise)), sleep(2000)]);
  }
}

function reserveLoopbackPort() {
  return new Promise((resolvePromise, reject) => {
    const probe = createServer();
    probe.unref();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close(() => reject(new Error("Unable to reserve a loopback DevTools port")));
        return;
      }
      const selected = address.port;
      probe.close((error) => error ? reject(error) : resolvePromise(selected));
    });
  });
}

async function waitForDevToolsEndpoint(debugPort) {
  let lastError = "not attempted";
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (browser?.exitCode !== null) throw new Error(`Chrome exited before DevTools became ready\n${chromeLog}`);
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`, { cache: "no-store" });
      if (response.ok) {
        const version = await response.json();
        if (typeof version?.webSocketDebuggerUrl === "string" || typeof version?.Browser === "string") return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(100);
  }
  throw new Error(`Chrome DevTools endpoint did not become ready on 127.0.0.1:${debugPort}; last=${lastError}\n${chromeLog}`);
}

class CdpClient {
  #ws;
  #nextId = 0;
  #pending = new Map();

  static async connect(url) {
    const client = new CdpClient(url);
    await client.#opened;
    return client;
  }

  #opened;
  constructor(url) {
    this.#ws = new WebSocket(url);
    this.#opened = new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP websocket open timeout")), 10000);
      this.#ws.addEventListener("open", () => { clearTimeout(timer); resolvePromise(); }, { once: true });
      this.#ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP websocket failed to open")); }, { once: true });
    });
    this.#ws.addEventListener("message", (event) => {
      let message;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      if (!message.id) return;
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(`CDP ${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result ?? {});
    });
    this.#ws.addEventListener("close", () => {
      for (const pending of this.#pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error(`CDP websocket closed during ${pending.method}`));
      }
      this.#pending.clear();
    });
  }

  call(method, params = {}, timeoutMs = 15000) {
    const id = ++this.#nextId;
    return new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`CDP ${method} timeout`));
      }, timeoutMs);
      this.#pending.set(id, { resolve: resolvePromise, reject, timer, method });
      this.#ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() { this.#ws.close(); }
}

async function evaluate(expression, timeoutMs = 15000) {
  const result = await cdp.call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true }, timeoutMs);
  if (result.exceptionDetails) throw new Error(`Browser evaluation failed: ${result.exceptionDetails.text ?? "unknown exception"}`);
  return result.result?.value;
}

async function pollBrowser(expression, predicate, label, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      last = await evaluate(expression, 3000);
      if (predicate(last)) return last;
    } catch (error) { last = error instanceof Error ? error.message : String(error); }
    await sleep(100);
  }
  throw new Error(`${label} timed out; last observation: ${JSON.stringify(last)}`);
}

async function navigate(url, expectedSearch) {
  await cdp.call("Page.navigate", { url }, 10000).catch(() => ({}));
  return pollBrowser(
    `({href:location.href,search:location.search,ready:document.readyState,title:document.title})`,
    (value) => value && value.search === expectedSearch && (value.ready === "interactive" || value.ready === "complete"),
    `navigation to ${url}`,
    15000
  );
}

function stageUpdatedWorker(releaseId) {
  const line = originalSw.split(/\r?\n/).find((candidate) => candidate.startsWith("const RELEASE_ID = "));
  if (!line) throw new Error("Built service worker release id line is missing");
  writeFileSync(swPath, originalSw.replace(line, `const RELEASE_ID = "${releaseId}";`), "utf8");
}

async function cleanup() {
  try { cdp?.close(); } catch {}
  await stopBrowser().catch(() => {});
  await stopServer().catch(() => {});
  writeFileSync(swPath, originalSw, "utf8");
  rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}

try {
  await startServer();
  const debugPort = await reserveLoopbackPort();
  browser = spawn(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: ["ignore", "pipe", "pipe"] });
  browser.stdout.on("data", (chunk) => appendLog("chrome", chunk));
  browser.stderr.on("data", (chunk) => appendLog("chrome", chunk));

  await waitForDevToolsEndpoint(debugPort);
  let targets;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      if (Array.isArray(targets) && targets.some((target) => target.type === "page" && target.webSocketDebuggerUrl)) break;
    } catch {}
    await sleep(100);
  }
  const page = Array.isArray(targets) ? targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl) : undefined;
  if (!page) throw new Error(`No Chrome page target became available\n${chromeLog}`);
  cdp = await CdpClient.connect(page.webSocketDebuggerUrl);
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");

  await navigate(`${base}/?p15_install=1`, "?p15_install=1");
  const installed = await evaluate(`(async()=>{
    const registration=await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const deadline=Date.now()+15000;
    while(!registration.active&&Date.now()<deadline) await new Promise(r=>setTimeout(r,100));
    const keys=(await caches.keys()).filter(k=>k.startsWith('command-center-shell:'));
    return {active:!!registration.active,keys};
  })()`);
  if (!installed?.active || installed.keys.length < 1) throw new Error(`Initial service-worker install/cache proof failed: ${JSON.stringify(installed)}`);

  await navigate(`${base}/?p15_controlled=1`, "?p15_controlled=1");
  const controlled = await pollBrowser(
    `({controller:!!navigator.serviceWorker.controller,app:document.querySelector('meta[name="application-name"]')?.content})`,
    (value) => value?.controller === true && value.app === "Command Center",
    "service-worker controller acquisition",
    15000
  );
  if (!controlled.controller) throw new Error("Service worker did not control the live page");

  await stopServer();
  await navigate(`${base}/?p15_offline=1`, "?p15_offline=1");
  const offline = await evaluate(`({
    app:document.querySelector('meta[name="application-name"]')?.content,
    controller:!!navigator.serviceWorker.controller,
    search:location.search
  })`);
  if (offline?.app !== "Command Center" || offline.controller !== true || offline.search !== "?p15_offline=1") {
    throw new Error(`Offline cached navigation was not served by the active worker: ${JSON.stringify(offline)}`);
  }

  await startServer();
  const updateRelease = `${process.env.GITHUB_SHA ?? "p15-local"}-p15-update`;
  stageUpdatedWorker(updateRelease);
  const waiting = await evaluate(`(async()=>{
    const registration=await navigator.serviceWorker.getRegistration('/');
    if(!registration) return {registration:false,waiting:false};
    await registration.update();
    const deadline=Date.now()+15000;
    while(!registration.waiting&&Date.now()<deadline) await new Promise(r=>setTimeout(r,100));
    return {registration:true,waiting:!!registration.waiting};
  })()`, 20000);
  if (!waiting?.registration || !waiting.waiting) throw new Error(`Updated service worker did not reach waiting state: ${JSON.stringify(waiting)}`);

  const activated = await evaluate(`(async()=>{
    const registration=await navigator.serviceWorker.getRegistration('/');
    if(!registration?.waiting) return {activated:false,reason:'no_waiting_worker'};
    const changed=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('controllerchange timeout')),12000);
      navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve(true);},{once:true});
    });
    registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
    await changed;
    const keys=(await caches.keys()).filter(k=>k.startsWith('command-center-shell:'));
    return {activated:true,controller:!!navigator.serviceWorker.controller,keys};
  })()`, 18000);
  if (!activated?.activated || !activated.controller || activated.keys.length !== 2) {
    throw new Error(`Explicit waiting-worker activation/two-cache retention failed: ${JSON.stringify(activated)}`);
  }

  console.log("P15.14 PWA lifecycle verified: install, same-session offline cache replay, waiting-worker activation, two-cache rollback retention");
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  if (serverLog) console.error(`--- P15 local server log ---\n${serverLog}`);
  if (chromeLog) console.error(`--- P15 Chrome log tail ---\n${chromeLog}`);
  process.exitCode = 1;
} finally {
  await cleanup();
}
