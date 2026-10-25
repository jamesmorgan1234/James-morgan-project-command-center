const RELEASE_ID = "__COMMAND_CENTER_RELEASE_ID__";
const CACHE_PREFIX = "command-center-shell:";
const CURRENT_CACHE = `${CACHE_PREFIX}${RELEASE_ID}`;
const META_PATH = "/__cc-release-meta__";
const CORE = ["/", "/index.html", "/app.css", "/project-system.css", "/owner-auth.css", "/manifest.webmanifest", "/release.json", "/app/runtime/browser-startup-runtime.js", "/app/runtime/browser-startup.js", "/app/runtime/browser-navigation-runtime.js", "/app/runtime/browser-navigation.js", "/app/runtime/browser.js"];
const SHELL_PATHS = new Set(CORE);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CURRENT_CACHE);
    await cache.addAll(CORE);
    await cache.put(META_PATH, new Response(JSON.stringify({ releaseId: RELEASE_ID, installedAt: Date.now() }), { headers: { "content-type": "application/json" } }));
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});

async function trimShellCaches() {
  const keys = (await caches.keys()).filter((key) => key.startsWith(CACHE_PREFIX));
  const records = await Promise.all(keys.map(async (key) => {
    const response = await (await caches.open(key)).match(META_PATH);
    const meta = response ? await response.json().catch(() => ({})) : {};
    return { key, installedAt: Number(meta.installedAt ?? 0) };
  }));
  records.sort((a, b) => b.installedAt - a.installedAt);
  await Promise.all(records.slice(2).map((record) => caches.delete(record.key)));
}

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await trimShellCaches();
    await self.clients.claim();
  })());
});

function isProtectedNetworkOnlyPath(pathname) {
  return pathname.startsWith("/api/") || pathname.startsWith("/__cc_auth__/") || pathname.startsWith("/auth/");
}

function isCacheableShellPath(pathname) {
  if (SHELL_PATHS.has(pathname)) return true;
  return pathname.startsWith("/app/") || pathname.startsWith("/assets/");
}

async function networkOnly(request) {
  return fetch(request, { cache: "no-store" });
}

async function shellNetworkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(CURRENT_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const shell = await caches.match("/index.html");
      if (shell) return shell;
    }
    throw new Error("Network unavailable and no cached shell response exists");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isProtectedNetworkOnlyPath(url.pathname)) {
    event.respondWith(networkOnly(request));
    return;
  }
  if (request.mode === "navigate" || isCacheableShellPath(url.pathname)) {
    event.respondWith(shellNetworkFirst(request));
    return;
  }
  event.respondWith(networkOnly(request));
});
