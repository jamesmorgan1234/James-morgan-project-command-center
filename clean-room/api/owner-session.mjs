const COOKIE_NAME = "__Host-cc-owner-refresh";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const MAX_BODY_BYTES = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 8_000;

function header(req, name) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function clearCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

function setRefreshCookie(res, refreshToken) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE_SECONDS}`);
}

function cookieValue(req, name) {
  const raw = header(req, "cookie");
  if (typeof raw !== "string") return undefined;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

function sameOrigin(req) {
  const origin = header(req, "origin");
  const host = header(req, "x-forwarded-host") ?? header(req, "host");
  const fetchSite = header(req, "sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  if (typeof origin !== "string" || typeof host !== "string") return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" && parsed.host === host;
  } catch {
    return false;
  }
}

function serverConfig() {
  const environment = process.env.CC_ENVIRONMENT;
  const supabaseUrl = process.env.CC_SUPABASE_URL;
  const projectRef = process.env.CC_SUPABASE_PROJECT_REF;
  const publishableKey = process.env.CC_SUPABASE_PUBLISHABLE_KEY;
  if (!["development", "test", "staging", "production"].includes(environment ?? "")) throw new Error("invalid_environment_configuration");
  if (!supabaseUrl || !projectRef || !publishableKey?.startsWith("sb_publishable_")) throw new Error("identity_provider_configuration_missing");
  const url = new URL(supabaseUrl);
  if (url.protocol !== "https:") throw new Error("identity_provider_https_required");
  if (url.hostname.endsWith(".supabase.co") && url.hostname !== `${projectRef}.supabase.co`) throw new Error("identity_provider_project_mismatch");
  return Object.freeze({ environment, supabaseUrl: url.origin, projectRef, publishableKey });
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") {
    const encoded = Buffer.from(JSON.stringify(req.body), "utf8");
    if (encoded.length > MAX_BODY_BYTES) throw new Error("body_too_large");
    return req.body;
  }
  if (typeof req.body === "string" && req.body.trim()) {
    if (Buffer.byteLength(req.body, "utf8") > MAX_BODY_BYTES) throw new Error("body_too_large");
    return JSON.parse(req.body);
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) throw new Error("body_too_large");
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function publicSession(payload) {
  const accessToken = typeof payload?.access_token === "string" ? payload.access_token : undefined;
  const expiresAt = Number.isFinite(Number(payload?.expires_at))
    ? Number(payload.expires_at)
    : Number.isFinite(Number(payload?.expires_in))
      ? Math.floor(Date.now() / 1000) + Number(payload.expires_in)
      : undefined;
  const userId = typeof payload?.user?.id === "string" ? payload.user.id : undefined;
  if (!accessToken || !expiresAt || !userId) return undefined;
  return { access_token: accessToken, expires_at: expiresAt, user: { id: userId } };
}

async function providerFetch(config, path, options = {}) {
  return fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: { apikey: config.publishableKey, ...(options.headers ?? {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
  });
}

async function refreshWithSupabase(config, refreshToken) {
  return providerFetch(config, "/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
}

async function revokeLocal(config, accessToken) {
  try {
    await providerFetch(config, "/auth/v1/logout?scope=local", { method: "POST", headers: { authorization: `Bearer ${accessToken}` } });
  } catch {}
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: "same_origin_required" });

  let body;
  try { body = await readJson(req); }
  catch (error) { return res.status(error?.message === "body_too_large" ? 413 : 400).json({ error: error?.message === "body_too_large" ? "body_too_large" : "invalid_json" }); }
  const action = typeof body?.action === "string" ? body.action : "";

  let config;
  try { config = serverConfig(); }
  catch {
    if (action === "clear") {
      clearCookie(res);
      return res.status(204).end();
    }
    return res.status(503).json({ error: "identity_provider_configuration_unavailable" });
  }

  if (action === "clear") {
    const refreshToken = cookieValue(req, COOKIE_NAME);
    if (refreshToken) {
      try {
        const refreshed = await refreshWithSupabase(config, refreshToken);
        if (refreshed.ok) {
          const payload = await refreshed.json();
          if (typeof payload?.access_token === "string") await revokeLocal(config, payload.access_token);
        }
      } catch {}
    }
    clearCookie(res);
    return res.status(204).end();
  }

  const refreshToken = action === "establish"
    ? (typeof body?.refreshToken === "string" ? body.refreshToken : undefined)
    : action === "refresh"
      ? cookieValue(req, COOKIE_NAME)
      : undefined;

  if (!refreshToken) {
    if (action === "refresh") clearCookie(res);
    return res.status(action === "refresh" ? 401 : 400).json({ error: action === "refresh" ? "owner_session_missing" : "refresh_token_required" });
  }
  if (action !== "establish" && action !== "refresh") return res.status(400).json({ error: "invalid_action" });

  let upstream;
  try { upstream = await refreshWithSupabase(config, refreshToken); }
  catch {
    clearCookie(res);
    return res.status(503).json({ error: "identity_provider_unavailable" });
  }
  if (!upstream.ok) {
    clearCookie(res);
    return res.status(401).json({ error: "owner_session_invalid" });
  }

  const payload = await upstream.json();
  const rotatedRefreshToken = typeof payload?.refresh_token === "string" ? payload.refresh_token : undefined;
  const session = publicSession(payload);
  if (!rotatedRefreshToken || !session) {
    clearCookie(res);
    return res.status(502).json({ error: "invalid_identity_provider_session" });
  }

  setRefreshCookie(res, rotatedRefreshToken);
  return res.status(200).json(session);
}
