const SUPABASE_URL = "https://gmlsucpwliegwlxymjvp.supabase.co";
const COOKIE_NAME = "__Host-cc-owner-refresh";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE_SECONDS}`
  );
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

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
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

async function refreshWithSupabase(refreshToken, publishableKey) {
  return fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store"
  });
}

async function revokeLocal(accessToken, publishableKey) {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout?scope=local`, {
      method: "POST",
      headers: { apikey: publishableKey, authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    });
  } catch {}
}

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: "same_origin_required" });

  const publishableKey = header(req, "x-cc-supabase-key");
  if (typeof publishableKey !== "string" || !publishableKey.startsWith("sb_publishable_")) {
    return res.status(400).json({ error: "publishable_key_required" });
  }

  let body;
  try { body = await readJson(req); }
  catch { return res.status(400).json({ error: "invalid_json" }); }
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "clear") {
    const refreshToken = cookieValue(req, COOKIE_NAME);
    if (refreshToken) {
      try {
        const refreshed = await refreshWithSupabase(refreshToken, publishableKey);
        if (refreshed.ok) {
          const payload = await refreshed.json();
          if (typeof payload?.access_token === "string") await revokeLocal(payload.access_token, publishableKey);
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
  try { upstream = await refreshWithSupabase(refreshToken, publishableKey); }
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
