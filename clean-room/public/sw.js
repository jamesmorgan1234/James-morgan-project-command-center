const RELEASE_ID = "__COMMAND_CENTER_RELEASE_ID__";
const CACHE_PREFIX = "command-center-shell:";
const CURRENT_CACHE = `${CACHE_PREFIX}${RELEASE_ID}`;
const META_PATH = "/__cc-release-meta__";
const RECOVERY_CONTROL_CACHE = "command-center-recovery-control:v1";
const RECOVERY_STATE_PATH = "/__cc-recovery-state__";
const CORE = ["/", "/index.html", "/app.css", "/primitive-system.css", "/project-system.css", "/owner-auth.css", "/manifest.webmanifest", "/release.json", "/app/runtime/browser-entrypoint.js", "/app/runtime/startup-config.js", "/app/runtime/browser-startup-runtime.js", "/app/runtime/browser-startup.js", "/app/runtime/browser-recovery.js", "/app/kernel/recovery.js", "/app/kernel/config.js", "/app/kernel/trusted-environment.mjs", "/app/runtime/browser-navigation-runtime.js", "/app/runtime/browser-navigation.js", "/app/runtime/browser.js", "/app/runtime/brain-view.js", "/app/runtime/browser-voice.js"];
const SHELL_PATHS = new Set(CORE);

function shellCacheName(releaseId) { return `${CACHE_PREFIX}${releaseId}`; }
function releaseIdFromCacheName(cacheName) { return cacheName.startsWith(CACHE_PREFIX) ? cacheName.slice(CACHE_PREFIX.length) : undefined; }

async function readJson(cacheName, path) {
  const response = await (await caches.open(cacheName)).match(path);
  return response ? response.json().catch(() => undefined) : undefined;
}

async function writeJson(cacheName, path, value) {
  const cache = await caches.open(cacheName);
  await cache.put(path, new Response(JSON.stringify(value), { headers: { "content-type": "application/json", "cache-control": "no-store" } }));
}

async function readRecoveryState() {
  const value = await readJson(RECOVERY_CONTROL_CACHE, RECOVERY_STATE_PATH);
  if (!value || typeof value !== "object") return { knownGoodReleaseId: null, fallbackReleaseId: null };
  return {
    knownGoodReleaseId: typeof value.knownGoodReleaseId === "string" && value.knownGoodReleaseId ? value.knownGoodReleaseId : null,
    fallbackReleaseId: typeof value.fallbackReleaseId === "string" && value.fallbackReleaseId ? value.fallbackReleaseId : null
  };
}

async function writeRecoveryState(state) {
  await writeJson(RECOVERY_CONTROL_CACHE, RECOVERY_STATE_PATH, {
    knownGoodReleaseId: state.knownGoodReleaseId ?? null,
    fallbackReleaseId: state.fallbackReleaseId ?? null
  });
}

async function shellCacheExists(releaseId) {
  if (!releaseId) return false;
  return (await caches.keys()).includes(shellCacheName(releaseId));
}

async function shellCacheRecords() {
  const keys = (await caches.keys()).filter((key) => key.startsWith(CACHE_PREFIX));
  return Promise.all(keys.map(async (key) => {
    const meta = await readJson(key, META_PATH) ?? {};
    return {
      key,
      releaseId: typeof meta.releaseId === "string" && meta.releaseId ? meta.releaseId : releaseIdFromCacheName(key),
      installedAt: Number(meta.installedAt ?? 0),
      knownGoodAt: Number(meta.knownGoodAt ?? 0)
    };
  }));
}

async function initializeRecoveryState() {
  const state = await readRecoveryState();
  if (state.knownGoodReleaseId && await shellCacheExists(state.knownGoodReleaseId)) return state;

  const previous = (await shellCacheRecords())
    .filter((record) => record.releaseId && record.releaseId !== RELEASE_ID)
    .sort((left, right) => (right.knownGoodAt - left.knownGoodAt) || (right.installedAt - left.installedAt));
  const transitional = previous[0]?.releaseId ?? null;
  const next = { knownGoodReleaseId: transitional, fallbackReleaseId: null };
  await writeRecoveryState(next);
  return next;
}

async function markCurrentReleaseKnownGood() {
  if (!await shellCacheExists(RELEASE_ID)) return false;
  const cache = await caches.open(CURRENT_CACHE);
  const currentMeta = await readJson(CURRENT_CACHE, META_PATH) ?? {};
  await cache.put(META_PATH, new Response(JSON.stringify({
    ...currentMeta,
    releaseId: RELEASE_ID,
    installedAt: Number(currentMeta.installedAt ?? Date.now()),
    knownGoodAt: Date.now()
  }), { headers: { "content-type": "application/json" } }));
  await writeRecoveryState({ knownGoodReleaseId: RELEASE_ID, fallbackReleaseId: null });
  return true;
}

async function queryKnownGoodFallback() {
  const state = await initializeRecoveryState();
  return Boolean(state.knownGoodReleaseId && state.knownGoodReleaseId !== RELEASE_ID && await shellCacheExists(state.knownGoodReleaseId));
}

async function restoreKnownGoodFallback() {
  const state = await initializeRecoveryState();
  const releaseId = state.knownGoodReleaseId;
  if (!releaseId || releaseId === RELEASE_ID || !await shellCacheExists(releaseId)) return false;
  await writeRecoveryState({ knownGoodReleaseId: releaseId, fallbackReleaseId: releaseId });
  return true;
}

async function clearRecoveryFallback() {
  const state = await readRecoveryState();
  await writeRecoveryState({ knownGoodReleaseId: state.knownGoodReleaseId, fallbackReleaseId: null });
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CURRENT_CACHE);
    await cache.addAll(CORE);
    await cache.put(META_PATH, new Response(JSON.stringify({ releaseId: RELEASE_ID, installedAt: Date.now(), knownGoodAt: 0 }), { headers: { "content-type": "application/json" } }));
  })());
});

self.addEventListener("message", (event) => {
  const reply = (ok) => event.ports?.[0]?.postMessage({ ok });
  if (event.data?.type === "QUERY_KNOWN_GOOD") {
    event.waitUntil(queryKnownGoodFallback().then((ok) => reply(ok), () => reply(false)));
    return;
  }
  if (event.data?.type === "RESTORE_KNOWN_GOOD") {
    event.waitUntil(restoreKnownGoodFallback().then((ok) => reply(ok), () => reply(false)));
    return;
  }
  if (event.data?.type === "MARK_RELEASE_KNOWN_GOOD") {
    event.waitUntil((async () => {
      if (event.data?.releaseId !== RELEASE_ID) { reply(false); return; }
      reply(await markCurrentReleaseKnownGood());
    })().catch(() => reply(false)));
    return;
  }
  if (event.data?.type === "ACTIVATE_UPDATE") {
    event.waitUntil((async () => {
      await clearRecoveryFallback();
      await self.skipWaiting();
    })());
  }
});

async function trimShellCaches() {
  const state = await initializeRecoveryState();
  const records = await shellCacheRecords();
  records.sort((a, b) => (b.knownGoodAt - a.knownGoodAt) || (b.installedAt - a.installedAt));

  const protectedKeys = new Set([CURRENT_CACHE]);
  if (state.knownGoodReleaseId) protectedKeys.add(shellCacheName(state.knownGoodReleaseId));
  if (state.fallbackReleaseId) protectedKeys.add(shellCacheName(state.fallbackReleaseId));
  const optionalSlots = Math.max(0, 2 - protectedKeys.size);
  for (const record of records.filter((candidate) => !protectedKeys.has(candidate.key)).slice(0, optionalSlots)) protectedKeys.add(record.key);
  await Promise.all(records.filter((record) => !protectedKeys.has(record.key)).map((record) => caches.delete(record.key)));
}

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await initializeRecoveryState();
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

async function currentCacheMayMutate() {
  const state = await readRecoveryState();
  return state.knownGoodReleaseId !== RELEASE_ID;
}

async function shellNetworkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET" && await currentCacheMayMutate()) {
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

async function fallbackShell(request, releaseId) {
  const cache = await caches.open(shellCacheName(releaseId));
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  if (request.mode === "navigate") {
    const shell = await cache.match("/index.html");
    if (shell) return shell;
  }
  return new Response("Recovery shell asset unavailable", { status: 503, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
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
    event.respondWith((async () => {
      const state = await readRecoveryState();
      if (state.fallbackReleaseId && await shellCacheExists(state.fallbackReleaseId)) {
        if (url.pathname === "/release.json" && url.searchParams.has("candidate")) return networkOnly(request);
        return fallbackShell(request, state.fallbackReleaseId);
      }
      return shellNetworkFirst(request);
    })());
    return;
  }
  event.respondWith(networkOnly(request));
});
