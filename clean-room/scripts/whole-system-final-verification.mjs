import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer as createNetServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

/**
 * Final whole-system rendered verification (nonproduction, pre-authorization).
 *
 * Deliberately does NOT reuse the earlier raw-CDP driver, which aborted
 * intermittently inside the headless shell. This harness drives a real
 * Chromium through Playwright's protocol layer and produces layout
 * measurements (not assertions inferred from source HTML):
 *
 *  - responsive geometry at phone / tablet / desktop widths
 *  - horizontal overflow, off-screen controls, clipped controls/content
 *  - nav fit, card/container geometry, dialog/menu fit, scroll behaviour
 *  - touch-target sizes at the phone viewport
 *  - real keyboard Tab traversal with focus-visibility measurement
 *  - rendered desktop route sweep across every declared route
 *
 * Evidence is written to the tracked evidence path; screenshots go to the
 * gitignored evidence/whole-system-sweep directory.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const CLEAN_ROOM = resolve(HERE, "..");
const REPO_ROOT = resolve(CLEAN_ROOM, "..");
const OUT = process.env.SWEEP_OUT ? resolve(process.env.SWEEP_OUT) : join(CLEAN_ROOM, "dist-web");
const EVIDENCE_PATH = process.env.SWEEP_EVIDENCE
  ? resolve(process.env.SWEEP_EVIDENCE)
  : join(CLEAN_ROOM, "evidence/WHOLE_SYSTEM_FINAL_VERIFICATION.json");
const SHOT_DIR = join(CLEAN_ROOM, "evidence/whole-system-sweep");
const PORT = Number(process.env.SWEEP_PORT ?? 4193);
const BASE = `http://127.0.0.1:${PORT}`;
const TAB_STEPS = Number(process.env.SWEEP_TAB_STEPS ?? 12);
const PHONE_ONLY = process.env.SWEEP_PHONE_ONLY === "1";
const REUSE_PATH = process.env.SWEEP_REUSE ? resolve(process.env.SWEEP_REUSE) : null;

const ROUTES = [
  ["/", "Command Center"],
  ["/projects", "Projects"],
  ["/active", "Active"],
  ["/next-up", "Next Up"],
  ["/project/fixture-critical", "[TEST]", "Candidate render: critical-priority fixture project detail"],
  ["/project/fixture-normal", "[TEST]", "Candidate render: normal-priority fixture project detail"],
  ["/project/fixture-low", "[TEST]", "Candidate render: low-priority fixture project detail"],
  ["/brain", "Brain"],
  ["/agency", "Agency"],
  ["/needs-me", "Needs Me"],
  ["/search", "Search"],
  ["/automations", "Automations"],
  ["/personal", "Personal"],
  ["/finance", "Finance"],
  ["/social", "Social"],
  ["/books", "Books"],
  ["/specialists", "Specialists"],
  ["/analytics", "Analytics"],
  ["/settings", "Settings"],
  ["/settings/security", "Security"],
  ["/settings/devices", "Devices"],
  ["/this-route-does-not-exist", "Route unavailable"]
];

const VIEWPORTS = PHONE_ONLY
  ? [{ id: "phone", width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }]
  : [
      { id: "phone", width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
      { id: "tablet", width: 768, height: 1024, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
      { id: "desktop", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false }
    ];

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

async function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE_PATH,
    join(REPO_ROOT, ".tools/harness/node_modules/playwright/index.js"),
    join(CLEAN_ROOM, "node_modules/playwright/index.js"),
    join(CLEAN_ROOM, "node_modules/playwright-core/index.js")
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const mod = await import(pathToFileURL(candidate).href);
    const playwright = mod.chromium ? mod : mod.default;
    if (playwright?.chromium) return { playwright, modulePath: candidate };
  }
  throw new Error(
    "Playwright is unavailable. Install it outside the project manifests (for example .tools/harness) and set PLAYWRIGHT_MODULE_PATH, or install a distro chromium and set CHROME_BIN."
  );
}

function resolveBrowserExecutable() {
  const candidates = [process.env.CHROME_BIN, join(REPO_ROOT, ".tools/chrome/chrome-linux/headless_shell")].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

if (!existsSync(join(OUT, "index.html"))) throw new Error(`Built artifact is missing at ${OUT}; run the browser build first`);

const { playwright, modulePath } = await loadPlaywright();
const executablePath = resolveBrowserExecutable();
const server = spawn("python3", [join(CLEAN_ROOM, "scripts/serve-spa.py"), String(PORT), OUT], { stdio: ["ignore", "ignore", "pipe"] });
let serverLog = "";
server.stderr.on("data", (chunk) => { serverLog += String(chunk).slice(-2000); });

const MEASURE = () => {
  const viewportWidth = document.documentElement.clientWidth;
  const style = (el) => getComputedStyle(el);
  const label = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.tagName || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute("role"),
    label: label(el),
    className: typeof el.className === "string" ? el.className.slice(0, 80) : null
  });
  const visible = (el) => {
    if (!el.getClientRects().length) return false;
    const s = style(el);
    return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0;
  };
  const interactiveSelector = 'a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"],[role="link"],[role="menuitem"],[role="tab"],[tabindex]:not([tabindex="-1"])';
  const interactive = [...document.querySelectorAll(interactiveSelector)]
    .filter((el) => visible(el) && !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true");

  const rects = interactive.map((el) => ({ el, rect: el.getBoundingClientRect() }));
  const offscreen = rects
    .filter(({ rect }) => rect.width > 0 && rect.height > 0 && (rect.right > viewportWidth + 1 || rect.left < -1))
    .map(({ el, rect }) => ({ ...describe(el), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }));

  const targets = rects.map(({ el, rect }) => ({ ...describe(el), width: Math.round(rect.width * 10) / 10, height: Math.round(rect.height * 10) / 10 })).filter((t) => t.width > 0 && t.height > 0);
  const under24 = targets.filter((t) => t.width < 24 || t.height < 24);
  const under44 = targets.filter((t) => t.width < 44 || t.height < 44);

  const clippedControls = rects
    .filter(({ el }) => {
      const s = style(el);
      return (s.overflowX === "hidden" || s.overflowX === "clip") && s.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0;
    })
    .map(({ el }) => ({ ...describe(el), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));

  const clippedContent = [...document.querySelectorAll("h1,h2,h3,p,li,dd,dt,td,th,span")]
    .filter((el) => {
      if (!visible(el)) return false;
      const s = style(el);
      return (s.overflowX === "hidden" || s.overflowX === "clip") && s.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && (el.textContent || "").trim().length > 0;
    })
    .slice(0, 10)
    .map((el) => ({ ...describe(el), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));

  const containers = [...document.querySelectorAll('[class*="card"],[class*="bevel"],section,article,[class*="panel"]')].filter(visible);
  const containerOverflow = containers
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0 && rect.right > viewportWidth + 1)
    .slice(0, 10)
    .map(({ el, rect }) => ({ ...describe(el), right: Math.round(rect.right) }));

  const nav = document.querySelector('nav,[role="navigation"]');
  const navRect = nav ? nav.getBoundingClientRect() : null;
  const navLinks = nav ? [...nav.querySelectorAll("a[href],button")].filter(visible) : [];
  const navLinksOffscreen = navLinks.filter((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && (rect.right > viewportWidth + 1 || rect.left < -1);
  }).length;

  const dialogSurfaces = [...document.querySelectorAll('dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"],.cc-dialog')].filter(visible);
  const dialogFits = dialogSurfaces.map((el) => {
    const rect = el.getBoundingClientRect();
    return { ...describe(el), width: Math.round(rect.width), height: Math.round(rect.height), fitsWidth: rect.width <= viewportWidth + 1, fitsHeight: rect.bottom <= window.innerHeight + 1, left: Math.round(rect.left), top: Math.round(rect.top) };
  });

  const images = [...document.images];
  const brokenImages = images.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src).slice(0, 5);
  const app = document.querySelector("#app");
  const main = document.querySelector("main");
  const headings = [...document.querySelectorAll("h1")].filter((node) => node.getClientRects().length);
  const heading = ((headings.at(-1)?.textContent) || "").replace(/\s+/g, " ").trim();
  const candidates = [main, app, document.body].filter(Boolean).map((node) => (node.innerText || "").replace(/\s+/g, " ").trim());
  const text = candidates.sort((a, b) => b.length - a.length)[0] ?? "";

  const beforeScrollX = window.scrollX;
  window.scrollTo(600, 0);
  const afterScrollX = window.scrollX;
  window.scrollTo(beforeScrollX, 0);

  return {
    viewportWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    overflowX: document.documentElement.scrollWidth - viewportWidth,
    bodyOverflowX: Math.max(0, document.body.scrollWidth - viewportWidth),
    horizontalScrollAllowed: afterScrollX > 0,
    internalLinkCount: document.querySelectorAll('a[href^="/"]').length,
    interactiveCount: interactive.length,
    focusableCount: [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(visible).length,
    targets: {
      measured: targets.length,
      under44Count: under44.length,
      under24Count: under24.length,
      under24: under24.slice(0, 12),
      smallest: targets.slice().sort((a, b) => a.width * a.height - b.width * b.height).slice(0, 8)
    },
    offscreenControls: offscreen.slice(0, 10),
    offscreenControlCount: offscreen.length,
    clippedControls: clippedControls.slice(0, 10),
    clippedControlCount: clippedControls.length,
    clippedContent: clippedContent.slice(0, 10),
    clippedContentCount: clippedContent.length,
    containerCount: containers.length,
    containerOverflow: containerOverflow.slice(0, 10),
    containerOverflowCount: containerOverflow.length,
    nav: {
      present: Boolean(nav),
      rect: navRect ? { left: Math.round(navRect.left), right: Math.round(navRect.right), width: Math.round(navRect.width) } : null,
      linkCount: navLinks.length,
      offscreenLinkCount: navLinksOffscreen,
      fits: navRect ? navRect.left >= -1 && navRect.right <= viewportWidth + 1 : null
    },
    dialogSurfaces: dialogFits.slice(0, 5),
    dialogSurfaceCount: dialogSurfaces.length,
    scroll: {
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      verticallyScrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight + 2
    },
    images: { total: images.length, brokenImages },
    render: {
      appNodeCount: app ? app.querySelectorAll("*").length : 0,
      heading,
      title: document.title,
      textLength: text.length,
      snippet: text.slice(0, 200),
      hasApplicationMeta: Boolean(document.querySelector('meta[name="application-name"]')),
      hasRuntimeReleaseMeta: Boolean(document.querySelector('meta[name="command-center-release"]')),
      routeShellRendered: text.length > 40 && (app ? app.querySelectorAll("*").length : 0) > 20
    }
  };
};

const FOCUS_STEP = () => {
  const el = document.activeElement;
  if (!el || el === document.body) {
    return { tag: "body", label: "body", role: null, focusable: false, visible: false, inViewport: false, focusIndicator: { outlineVisible: false, shadowVisible: false, outlineStyle: "none", outlineWidth: "0px", boxShadow: "none" } };
  }
  const s = getComputedStyle(el);
  const outlineVisible = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
  const shadowVisible = s.boxShadow !== "none";
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    label: (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50),
    role: el.getAttribute("role"),
    focusable: /^(a|button|input|select|textarea|summary)$/i.test(el.tagName) || el.hasAttribute("tabindex"),
    focusIndicator: { outlineVisible, shadowVisible, outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow === "none" ? "none" : s.boxShadow.slice(0, 60) },
    visible: rect.width > 0 && rect.height > 0,
    inViewport: rect.bottom > 0 && rect.top < window.innerHeight + 1 && rect.right > 0 && rect.left < window.innerWidth + 1
  };
};

function openableSurface() {
  return document.querySelector('[aria-haspopup="dialog"],[aria-haspopup="menu"],[data-opens-dialog],button[aria-expanded="false"]');
}

const DEFECTS = [];
function defect(scope, kind, detail) { DEFECTS.push({ scope, kind, detail }); }

const results = [];
let browser;
let summary = null;
let browserVersion = "unknown";

try {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try { if ((await fetch(`${BASE}/index.html`, { cache: "no-store" })).ok) break; } catch {}
    await sleep(100);
  }
  const entryProbe = await fetch(`${BASE}/app/runtime/browser-entrypoint.js`);
  if (!entryProbe.ok) throw new Error(`Sweep server cannot serve the app entrypoint: status=${entryProbe.status} ${serverLog}`);
  mkdirSync(SHOT_DIR, { recursive: true });

  if (REUSE_PATH) {
    if (!existsSync(REUSE_PATH)) throw new Error(`SWEEP_REUSE points at a missing measurement file: ${REUSE_PATH}`);
    const saved = JSON.parse(readFileSync(REUSE_PATH, "utf8"));
    results.push(...(saved.results ?? []));
    for (const entry of saved.defects ?? []) DEFECTS.push(entry);
    browserVersion = saved.harness?.browser ?? process.env.SWEEP_BROWSER_LABEL ?? "reused-measurements";
    console.log(JSON.stringify({ reuse: REUSE_PATH, rows: results.length, defects: DEFECTS.length }));
  } else {
  browser = await playwright.chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });
  browserVersion = browser.version();

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch
    });
    let consoleErrors = [];
    let pageErrors = [];
    let networkFailures = [];
    let pageCrashCount = 0;
    const bind = (target) => {
      target.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300)); });
      target.on("pageerror", (error) => pageErrors.push(String(error?.message ?? error).slice(0, 300)));
      target.on("response", (response) => {
        const type = String(response.headers()["content-type"] ?? "");
        if (response.status() >= 400 || (/octet-stream/.test(type) && /\.js\b/.test(response.url()))) {
          networkFailures.push(`${response.status()} ${type} ${response.url().slice(0, 160)}`);
        }
      });
      target.on("requestfailed", (request) => networkFailures.push(`failed ${request.failure()?.errorText ?? ""} ${request.url().slice(0, 140)}`));
      target.on("crash", () => { pageCrashCount += 1; });
    };
    const newPage = async () => {
      const created = await context.newPage();
      created.setDefaultTimeout(15000);
      created.setDefaultNavigationTimeout(30000);
      bind(created);
      return created;
    };
    let page = await newPage();

    for (const [path, expectedHeading] of ROUTES) {
      consoleErrors = []; pageErrors = []; networkFailures = [];
      let row = null;
      try {
      await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 }).catch((error) => { defect(`${viewport.id}${path}`, "navigation", String(error.message).slice(0, 200)); });
      await page.waitForFunction((expected) => {
        const root = document.querySelector("#app");
        if (!root || root.querySelectorAll("*").length < 20) return false;
        const visibleHeadings = [...document.querySelectorAll("h1")].filter((node) => node.getClientRects().length);
        const heading = (visibleHeadings.at(-1)?.textContent ?? "").trim();
        const rendered = [document.querySelector("main"), root, document.body].filter(Boolean).map((node) => (node.innerText || "").trim());
        const hasText = Math.max(0, ...rendered.map((value) => value.length)) > 40;
        return hasText && heading.length > 0 && (expected === null || heading.toLowerCase().includes(String(expected).toLowerCase()));
      }, expectedHeading ?? null, { timeout: 8000 }).catch(() => {});
      // Command Center keeps the outgoing screen mounted during its route transition; settle so the
      // measured geometry belongs to the incoming route rather than the one being replaced.
      await page.waitForTimeout(350);
      await page.waitForTimeout(150);

      const observation = await page.evaluate(MEASURE).catch((error) => ({ error: String(error.message) }));
      const expectedHeadingText = typeof expectedHeading === "string" ? expectedHeading : "";
      const slug = path === "/" ? "home" : path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
      const screenshotPath = join(SHOT_DIR, `${viewport.id}-${slug}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
      if (process.env.SWEEP_FULL_PAGE === "1") await page.screenshot({ path: join(SHOT_DIR, `${viewport.id}-${slug}-full.png`), fullPage: true }).catch(() => {});

      const headingMatches = expectedHeading === null || (observation?.render?.heading ?? "").toLowerCase().includes(expectedHeadingText.toLowerCase());

      // Keyboard traversal with real key events.
      await page.evaluate(() => { document.body.focus(); window.scrollTo(0, 0); });
      const focusOrder = [];
      for (let step = 0; step < TAB_STEPS; step += 1) {
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(FOCUS_STEP).catch(() => null);
        if (focused) focusOrder.push(focused);
      }
      // A focus trap shows up as the same control holding focus twice in a row
      // (or focus never advancing); repeated labels across nav groups are not a trap.
      const focusCycle = focusOrder.some((entry, index) => index > 0 && entry.focusable && entry.label === focusOrder[index - 1].label);
      const stuckOnBody = focusOrder.filter((f) => f.tag === "body").length;
      const focusableReached = focusOrder.filter((f) => f.focusable).length;
      const withoutIndicator = focusOrder.filter((f) => f.focusable && !f.focusIndicator?.outlineVisible && !f.focusIndicator?.shadowVisible);
      const offscreenFocus = focusOrder.filter((f) => f.focusable && !f.inViewport);

      // Dialog / menu surface, when the route actually has one.
      let surface = null;
      const triggerHandle = await page.evaluateHandle(openableSurface).catch(() => null);
      const trigger = triggerHandle?.asElement?.() ?? null;
      if (trigger) {
        const triggerLabel = await trigger.evaluate((el) => (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 50)).catch(() => "");
        const opened = await trigger.click({ timeout: 4000 }).then(() => true).catch(() => false);
        if (opened) {
          await page.waitForTimeout(250);
          surface = await page.evaluate(() => {
            const el = [...document.querySelectorAll('dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"],.cc-dialog')].find((node) => node.getClientRects().length);
            if (!el) return { opened: false, focusInside: false, modal: false };
            const rect = el.getBoundingClientRect();
            const focused = document.activeElement;
            return {
              opened: true,
              modal: el.getAttribute("role") === "dialog" || el.getAttribute("aria-modal") === "true" || el.tagName.toLowerCase() === "dialog",
              labelled: Boolean(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              fitsWidth: rect.width <= document.documentElement.clientWidth + 1,
              fitsHeight: rect.height <= window.innerHeight + 2 && rect.bottom <= window.innerHeight + 2,
              focusInside: Boolean(focused && el.contains(focused))
            };
          }).catch(() => ({ opened: false, focusInside: false, modal: false }));
          await page.keyboard.press("Escape");
          await page.waitForTimeout(200);
          surface.focusReturnedToTrigger = await page.evaluate((labelText) => {
            const active = document.activeElement;
            return Boolean(active && (active.textContent || "").includes(labelText.slice(0, 20)));
          }, triggerLabel).catch(() => false);
          surface.triggerLabel = triggerLabel;
          surface.closedOnEscape = await page.evaluate(() => ![...document.querySelectorAll('dialog[open],[role="dialog"],[aria-modal="true"]')].some((node) => node.getClientRects().length)).catch(() => null);
        } else {
          surface = { opened: false, reason: "trigger was not activatable" };
        }
      }

      // Disclosure/menu surface (details/summary navigation), when present.
      let menu = null;
      const summaryEl = await page.$("details > summary, summary[aria-expanded], [data-menu-toggle]").catch(() => null);
      if (summaryEl) {
        const triggerLabel = await summaryEl.evaluate((el) => (el.textContent || "").trim().slice(0, 40)).catch(() => "");
        await summaryEl.click({ timeout: 4000 }).catch(() => {});
        await page.waitForTimeout(200);
        menu = await page.evaluate(() => {
          const details = [...document.querySelectorAll("details[open]")].find((node) => node.getClientRects().length);
          if (!details) return { opened: false };
          const panel = details.querySelector(".navigation-grid, [class*=navigation-grid], nav, ul, [class*=panel]") ?? details;
          const rect = panel.getBoundingClientRect();
          const links = [...panel.querySelectorAll("a[href],button")].filter((el) => el.getClientRects().length);
          const offscreenLinks = links.filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > document.documentElement.clientWidth + 1 || r.left < -1); }).length;
          return {
            opened: true,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            linkCount: links.length,
            offscreenLinks,
            fitsWidth: rect.left >= -1 && rect.width <= document.documentElement.clientWidth + 1,
            fitsViewport: rect.top >= -1 && rect.bottom <= window.innerHeight + 2
          };
        }).catch(() => null);
        if (menu?.opened) {
          await page.keyboard.press("Escape");
          await page.waitForTimeout(150);
          menu.escapeCloses = await page.evaluate(() => ![...document.querySelectorAll("details[open]")].some((node) => node.getClientRects().length)).catch(() => null);
          menu.triggerLabel = triggerLabel;
          if (!menu.escapeCloses) await page.evaluate(() => { for (const node of document.querySelectorAll("details[open]")) node.open = false; }).catch(() => {});
        }
      }

      row = {
        viewport: viewport.id,
        path,
        expectedHeading,
        headingMatches,
        ...observation,
        keyboard: {
          steps: TAB_STEPS,
          focusableReached,
          stuckOnBody,
          distinctFocusLabelPairs: new Set(focusOrder.map((f) => `${f.tag}:${f.label}`)).size,
          cyclic: focusCycle,
          withoutVisibleFocusIndicator: withoutIndicator.slice(0, 8),
          offscreenFocus: offscreenFocus.slice(0, 5),
          order: focusOrder.slice(0, 14).map((f) => ({ tag: f.tag, label: f.label, role: f.role, outline: f.focusIndicator?.outlineVisible === true, shadow: f.focusIndicator?.shadowVisible === true }))
        },
        dialog: surface,
        menu,
        consoleErrors: consoleErrors.slice(0, 5),
        pageErrors: pageErrors.slice(0, 5),
        networkFailures: networkFailures.slice(0, 5),
        screenshots: {
          viewport: `clean-room/evidence/whole-system-sweep/${viewport.id}-${slug}.png`,
          full: `clean-room/evidence/whole-system-sweep/${viewport.id}-${slug}-full.png`
        }
      };
      row.passed = Boolean(observation && !observation.error)
        && row.render.routeShellRendered
        && headingMatches
        && row.overflowX <= 1
        && row.offscreenControlCount === 0
        && row.clippedControlCount === 0
        && row.containerOverflowCount === 0
        && row.images.brokenImages.length === 0
        && row.consoleErrors.length === 0
        && row.pageErrors.length === 0
        && row.networkFailures.length === 0
        && (row.dialog === null || row.dialog.fitsWidth !== false && row.dialog.fitsHeight !== false)
        && (row.menu === null || (row.menu.fitsWidth !== false && (row.menu.offscreenLinks ?? 0) === 0));
      } catch (harnessError) {
        try { await page.close(); } catch {}
        page = await newPage();
        row = {
          viewport: viewport.id,
          path,
          expectedHeading,
          headingMatches: false,
          render: { routeShellRendered: false, heading: "", title: "", textLength: 0 },
          overflowX: 0,
          offscreenControlCount: 0,
          clippedControlCount: 0,
          containerOverflowCount: 0,
          images: { brokenImages: [] },
          nav: { present: false, fits: null, linkCount: 0, offscreenLinkCount: 0 },
          keyboard: { steps: 0, focusableReached: 0, cyclic: false, withoutVisibleFocusIndicator: [] },
          targets: { measured: 0, under24Count: 0, under44Count: 0 },
          consoleErrors: [],
          pageErrors: [],
          networkFailures: [],
          dialog: null,
          harnessError: String(harnessError?.message ?? harnessError).slice(0, 200),
          passed: false
        };
        defect(`${viewport.id}${path}`, "harness-crash", row.harnessError);
      }
      if (!row.passed) {
        defect(`${viewport.id}${path}`, "route", {
          renderRendered: row.render?.routeShellRendered === true,
          headingMatches: row.headingMatches === true,
          overflowX: row.overflowX,
          offscreen: row.offscreenControlCount,
          clippedControls: row.clippedControlCount,
          containerOverflow: row.containerOverflowCount,
          brokenImages: row.images.brokenImages.length,
          consoleErrors: row.consoleErrors,
          pageErrors: row.pageErrors,
          networkFailures: row.networkFailures,
          error: row.error ?? null
        });
      }
      if (viewport.id === "phone" && (row.targets?.under24Count ?? 0) > 0) defect(`phone${path}`, "touch-target-under-24px", row.targets.under24);
      if (row.headingMatches === false) defect(`${viewport.id}${path}`, "heading-mismatch", { expected: expectedHeading, actual: row.render.heading });
      if (pageCrashCount > 0) row.rendererCrashRecovered = true;
      results.push(row);
    }
    mkdirSync(dirname(EVIDENCE_PATH), { recursive: true });
    writeFileSync(EVIDENCE_PATH, `${JSON.stringify({
      schemaVersion: "cc-whole-system-final-verification-v1",
      partial: true,
      generatedAt: new Date().toISOString(),
      completedViewports: [...new Set(results.map((row) => row.viewport))],
      observationCount: results.length,
      defectCount: DEFECTS.length,
      defects: DEFECTS.slice(0, 40),
      results
    }, null, 2)}\n`);
    await context.close();
  }
  }

  const byViewport = {};
  for (const viewport of VIEWPORTS) {
    const rows = results.filter((row) => row.viewport === viewport.id);
    byViewport[viewport.id] = {
      width: viewport.width,
      height: viewport.height,
      routeCount: rows.length,
      passed: rows.filter((row) => row.passed).length,
      maxOverflowX: Math.max(...rows.map((row) => row.overflowX ?? 0)),
      totalOffscreenControls: rows.reduce((sum, row) => sum + (row.offscreenControlCount ?? 0), 0),
      totalClippedControls: rows.reduce((sum, row) => sum + (row.clippedControlCount ?? 0), 0),
      totalContainerOverflow: rows.reduce((sum, row) => sum + (row.containerOverflowCount ?? 0), 0),
      routesWithBrokenImages: rows.filter((row) => (row.images?.brokenImages?.length ?? 0) > 0).map((row) => row.path),
      routesWithConsoleErrors: rows.filter((row) => (row.consoleErrors?.length ?? 0) > 0).map((row) => row.path),
      routesWithPageErrors: rows.filter((row) => (row.pageErrors?.length ?? 0) > 0).map((row) => row.path),
      routesWithNetworkFailures: rows.filter((row) => (row.networkFailures?.length ?? 0) > 0).map((row) => row.path),
      routesWithoutNavFit: rows.filter((row) => row.nav?.present && row.nav?.fits === false).map((row) => row.path),
      minInteractiveCount: Math.min(...rows.map((row) => row.interactiveCount ?? 0)),
      keyboard: {
        routes: rows.length,
        routesWithFocusableTargets: rows.filter((row) => (row.keyboard?.focusableReached ?? 0) > 0).length,
        routesWithCycle: rows.filter((row) => row.keyboard?.cyclic === true).map((row) => row.path),
        routesWithTargetsLackingVisibleFocus: rows.filter((row) => (row.keyboard?.withoutVisibleFocusIndicator?.length ?? 0) > 0).map((row) => row.path),
        maxTabStepsWithoutFocusable: Math.max(0, ...rows.map((row) => row.keyboard?.stuckOnBody ?? 0))
      }
    };
  }

  const phoneRows = results.filter((row) => row.viewport === "phone");
  const touch = {
    viewport: "phone 390x844",
    routesMeasured: phoneRows.length,
    targetsMeasured: phoneRows.reduce((sum, row) => sum + (row.targets?.measured ?? 0), 0),
    under24: phoneRows.reduce((sum, row) => sum + (row.targets?.under24Count ?? 0), 0),
    under44: phoneRows.reduce((sum, row) => sum + (row.targets?.under44Count ?? 0), 0),
    smallestTargets: phoneRows.flatMap((row) => (row.targets?.smallest ?? []).map((target) => ({ ...target, path: row.path }))).sort((a, b) => a.width * a.height - b.width * b.height).slice(0, 10),
    undersizedExamples: phoneRows.flatMap((row) => (row.targets?.under24 ?? []).map((target) => ({ ...target, path: row.path }))).slice(0, 15)
  };

  const dialogRows = results.filter((row) => row.dialog !== null);
  const dialogs = {
    routesWithSurface: dialogRows.length,
    opened: dialogRows.filter((row) => row.dialog?.opened).length,
    modal: dialogRows.filter((row) => row.dialog?.modal).length,
    fittedWidth: dialogRows.filter((row) => row.dialog?.fitsWidth !== false).length,
    focusInsideOnOpen: dialogRows.filter((row) => row.dialog?.focusInside).length,
    closedOnEscape: dialogRows.filter((row) => row.dialog?.closedOnEscape).length,
    focusReturned: dialogRows.filter((row) => row.dialog?.focusReturnedToTrigger).length,
    samples: dialogRows.slice(0, 5).map((row) => ({ viewport: row.viewport, path: row.path, ...row.dialog }))
  };

  const menuRows = results.filter((row) => row.menu !== null && row.menu !== undefined);
  const menus = {
    routesWithSurface: menuRows.length,
    opened: menuRows.filter((row) => row.menu?.opened).length,
    fittedWidth: menuRows.filter((row) => row.menu?.fitsWidth !== false).length,
    fittedViewport: menuRows.filter((row) => row.menu?.fitsViewport !== false).length,
    closedOnEscape: menuRows.filter((row) => row.menu?.escapeCloses === true).length,
    routesWithOffscreenMenuLinks: menuRows.filter((row) => (row.menu?.offscreenLinks ?? 0) > 0).map((row) => row.path),
    samples: menuRows.slice(0, 5).map((row) => ({ viewport: row.viewport, path: row.path, ...row.menu }))
  };

  let release = null;
  try { release = JSON.parse(readFileSync(join(OUT, "release.json"), "utf8")); } catch { release = null; }

  summary = {
    schemaVersion: "cc-whole-system-final-verification-v1",
    generatedAt: new Date().toISOString(),
    harness: {
      driver: "playwright",
      module: modulePath,
      playwrightVersion: JSON.parse(readFileSync(join(dirname(modulePath), "package.json"), "utf8")).version,
      browser: `chromium ${browserVersion}`,
      browserExecutable: executablePath ?? "playwright-managed",
      note: "Replaces the earlier raw CDP driver that aborted intermittently in the headless shell. Layout measurements come from a real Chromium layout engine."
    },
    testedArtifact: { directory: OUT, release },
    viewports: VIEWPORTS.map(({ id, width, height, deviceScaleFactor }) => ({ id, width, height, deviceScaleFactor })),
    routeCount: ROUTES.length,
    observationCount: results.length,
    byViewport,
    touch,
    dialogs,
    menus,
    defectCount: DEFECTS.length,
    defects: DEFECTS.slice(0, 40),
    results
  };
  mkdirSync(dirname(EVIDENCE_PATH), { recursive: true });
  writeFileSync(EVIDENCE_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify({
    harness: summary.harness.browser,
    observationCount: summary.observationCount,
    byViewport,
    touch: { targetsMeasured: touch.targetsMeasured, under24: touch.under24, under44: touch.under44 },
    dialogs,
    menus,
    defectCount: summary.defectCount,
    defects: summary.defects.slice(0, 10)
  }, null, 2));
  if (DEFECTS.length) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server.exitCode === null) server.kill("SIGTERM");
}
