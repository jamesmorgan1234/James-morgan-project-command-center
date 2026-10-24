const RELEASE_ID = "__COMMAND_CENTER_RELEASE_ID__";
const CACHE_PREFIX = "command-center-shell:";
const CURRENT_CACHE = `${CACHE_PREFIX}${RELEASE_ID}`;
const META_PATH = "/__cc-release-meta__";
const CORE = ["/", "/index.html", "/app.css", "/owner-auth.css", "/manifest.webmanifest", "/release.json", "/app/runtime/browser.js"];

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

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET" && new URL(request.url).origin === self.location.origin) {
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
    throw new Error("Network unavailable and no cached response exists");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});
