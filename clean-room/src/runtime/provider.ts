import { createDisconnectedRuntimeSnapshot, type CommandCenterRuntimeSnapshot } from "./snapshot.js";
import { installOwnerSignOutControl, promptForOwnerCredentials } from "./owner-auth-ui.js";
import { ManagedOwnerRuntimeProvider } from "./owner-security-provider.js";
import { SupabaseOwnerRuntimeSnapshotProvider, type SessionStorageLike } from "./supabase-owner-provider.js";

export interface RuntimeSnapshotProvider {
  readonly id: string;
  load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
}

export class DisconnectedRuntimeSnapshotProvider implements RuntimeSnapshotProvider {
  readonly id: string;
  constructor(id = "runtime:disconnected") { this.id = id; }
  async load(): Promise<CommandCenterRuntimeSnapshot> { return createDisconnectedRuntimeSnapshot(this.id); }
}

export interface HttpRuntimeSnapshotProviderOptions {
  readonly endpoint: string;
  readonly fetcher?: typeof fetch;
  readonly timeoutMs?: number;
}

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }

function isRuntimeSnapshot(value: unknown): value is CommandCenterRuntimeSnapshot {
  if (!isObject(value) || value.schemaVersion !== "cc-runtime-snapshot-v1") return false;
  if (typeof value.generatedAt !== "string" || !isObject(value.connection) || !Array.isArray(value.projects) || !Array.isArray(value.surfaces)) return false;
  const state = value.connection.state;
  return state === "connected" || state === "disconnected" || state === "degraded" || state === "stale";
}

export class HttpRuntimeSnapshotProvider implements RuntimeSnapshotProvider {
  readonly id = "runtime:http";
  readonly #endpoint: string;
  readonly #fetcher: typeof fetch;
  readonly #timeoutMs: number;

  constructor(options: HttpRuntimeSnapshotProviderOptions) {
    const endpoint = options.endpoint.trim();
    if (!endpoint) throw new Error("Runtime endpoint is required");
    this.#endpoint = endpoint;
    this.#fetcher = options.fetcher ?? fetch;
    this.#timeoutMs = options.timeoutMs ?? 8000;
  }

  async load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    const relayAbort = (): void => controller.abort();
    signal?.addEventListener("abort", relayAbort, { once: true });
    try {
      const fetcher = this.#fetcher;
      const response = await fetcher(this.#endpoint, {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal
      });
      if (!response.ok) return createDisconnectedRuntimeSnapshot(this.id);
      const payload: unknown = await response.json();
      return isRuntimeSnapshot(payload) ? payload : createDisconnectedRuntimeSnapshot(this.id);
    } catch {
      return createDisconnectedRuntimeSnapshot(this.id);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", relayAbort);
    }
  }
}

const OWNER_SESSION_KEY = "command-center:owner-session:v1";
const OWNER_DEVICE_KEY = "command-center:owner-device:v1";
const BROKER_REFRESH_SENTINEL = "__command_center_http_only_refresh__";
const BROKER_RESTORE_ACCESS_SENTINEL = "__command_center_restore__";

class EphemeralOwnerSessionStorage implements SessionStorageLike {
  readonly #values = new Map<string, string>();

  constructor(seedBrokerRestore: boolean) {
    if (!seedBrokerRestore) return;
    this.#values.set(OWNER_SESSION_KEY, JSON.stringify({
      accessToken: BROKER_RESTORE_ACCESS_SENTINEL,
      refreshToken: BROKER_REFRESH_SENTINEL,
      expiresAt: 0,
      userId: BROKER_RESTORE_ACCESS_SENTINEL
    }));
  }

  getItem(key: string): string | null { return this.#values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.#values.set(key, value); }
  removeItem(key: string): void { this.#values.delete(key); }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

function sessionPayloadWithBrokerSentinel(payload: unknown): unknown {
  if (!isObject(payload)) return payload;
  if (typeof payload.access_token !== "string" || !payload.access_token) return payload;
  return { ...payload, refresh_token: BROKER_REFRESH_SENTINEL };
}

function persistentOwnerDeviceId(documentRef: Document): string {
  const windowRef = documentRef.defaultView;
  const cryptoRef = windowRef?.crypto ?? globalThis.crypto;
  if (!cryptoRef?.randomUUID) throw new Error("Secure device identity is unavailable");
  let storage: Storage | undefined;
  try { storage = windowRef?.localStorage; } catch {}
  try {
    const existing = storage?.getItem(OWNER_DEVICE_KEY)?.trim();
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
  } catch {}
  const generated = cryptoRef.randomUUID();
  try { storage?.setItem(OWNER_DEVICE_KEY, generated); } catch {}
  return generated;
}

function ownerDeviceMetadata(documentRef: Document): { label: string; platform: string } {
  const nav = documentRef.defaultView?.navigator;
  const platform = (nav?.platform || "Browser").trim().slice(0, 120) || "Browser";
  return { label: `${platform} owner device`, platform };
}

function ownerAuthFetch(documentRef: Document, supabaseUrl: string, publishableKey: string): { fetcher: typeof fetch; storage: SessionStorageLike } {
  let page: URL | undefined;
  try { page = new URL(documentRef.baseURI); } catch {}
  const useVercelProxy = page?.protocol === "https:" && page.hostname.endsWith(".vercel.app");
  const useSessionBroker = useVercelProxy;
  const upstreamAuthBase = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/`;
  const rpcBase = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/`;
  const proxyAuthBase = page ? new URL("/__cc_auth__/", page).toString() : "";
  const brokerUrl = page ? new URL("/api/owner-session", page).toString() : "";
  const storage = new EphemeralOwnerSessionStorage(useSessionBroker);
  const clientDeviceId = persistentOwnerDeviceId(documentRef);
  const deviceMetadata = ownerDeviceMetadata(documentRef);

  const broker = async (action: "establish" | "refresh" | "clear", refreshToken?: string): Promise<Response> => {
    if (!useSessionBroker || !brokerUrl) return jsonResponse({ error: "secure_session_broker_unavailable" }, 401);
    return fetch(brokerUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-cc-supabase-key": publishableKey
      },
      body: JSON.stringify(refreshToken ? { action, refreshToken } : { action }),
      credentials: "same-origin",
      cache: "no-store"
    });
  };

  const touchCanonicalSession = async (payload: unknown): Promise<boolean> => {
    if (!isObject(payload)) return false;
    const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
    if (!accessToken || accessToken === BROKER_RESTORE_ACCESS_SENTINEL) return false;
    try {
      const response = await fetch(`${rpcBase}command_center_touch_current_session`, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({
          p_client_device_id: clientDeviceId,
          p_label: deviceMetadata.label,
          p_platform: deviceMetadata.platform
        }),
        cache: "no-store"
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const proxiedAuthFetch = async (raw: string, input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!useVercelProxy || !proxyAuthBase || !raw.startsWith(upstreamAuthBase)) return fetch(input, init);
    const proxied = `${proxyAuthBase}${raw.slice(upstreamAuthBase.length)}`;
    if (input instanceof Request) return fetch(new Request(proxied, input), init);
    return fetch(proxied, init);
  };

  const brokerAuthenticatedSession = async (response: Response, brokerRequired: boolean): Promise<Response> => {
    const payload: unknown = await response.json();
    if (!isObject(payload)) return jsonResponse(payload, response.status);
    const refreshToken = typeof payload.refresh_token === "string" ? payload.refresh_token : "";
    if (!refreshToken) return jsonResponse(payload, response.status);
    if (!useSessionBroker) {
      if (brokerRequired) return jsonResponse({ error: "secure_session_broker_required" }, 401);
      if (!await touchCanonicalSession(payload)) return jsonResponse({ error: "owner_session_registration_failed" }, 401);
      return jsonResponse(sessionPayloadWithBrokerSentinel(payload), response.status);
    }
    const established = await broker("establish", refreshToken);
    if (!established.ok) return established;
    const brokerPayload: unknown = await established.json();
    if (!await touchCanonicalSession(brokerPayload)) {
      await broker("clear");
      return jsonResponse({ error: "owner_session_registration_failed" }, 401);
    }
    return jsonResponse(sessionPayloadWithBrokerSentinel(brokerPayload), established.status);
  };

  const fetcher: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (!raw.startsWith(upstreamAuthBase)) return fetch(input, init);

    const authUrl = new URL(raw);
    const grantType = authUrl.pathname.endsWith("/token") ? authUrl.searchParams.get("grant_type") : null;

    if (grantType === "refresh_token") {
      if (!useSessionBroker) return jsonResponse({ error: "secure_session_restore_requires_same_origin_broker" }, 401);
      const response = await broker("refresh");
      if (!response.ok) return response;
      const payload: unknown = await response.json();
      if (!await touchCanonicalSession(payload)) {
        await broker("clear");
        return jsonResponse({ error: "owner_session_registration_failed" }, 401);
      }
      return jsonResponse(sessionPayloadWithBrokerSentinel(payload), response.status);
    }

    if (authUrl.pathname.endsWith("/logout") && useSessionBroker) {
      return broker("clear");
    }

    const response = await proxiedAuthFetch(raw, input, init);
    if (!response.ok) return response;

    if (grantType === "password") return brokerAuthenticatedSession(response, false);
    if (authUrl.pathname.endsWith("/passkeys/authentication/verify")) return brokerAuthenticatedSession(response, true);
    return response;
  };

  return { fetcher, storage };
}

export function providerFromDocument(documentRef: Document): RuntimeSnapshotProvider {
  const endpoint = documentRef.querySelector<HTMLMetaElement>('meta[name="command-center-runtime-endpoint"]')?.content.trim();
  if (endpoint) return new HttpRuntimeSnapshotProvider({ endpoint });

  const supabaseUrl = documentRef.querySelector<HTMLMetaElement>('meta[name="command-center-supabase-url"]')?.content.trim();
  const publishableKey = documentRef.querySelector<HTMLMetaElement>('meta[name="command-center-supabase-publishable-key"]')?.content.trim();
  const releaseId = documentRef.querySelector<HTMLMetaElement>('meta[name="command-center-release"]')?.content.trim();
  if (supabaseUrl && publishableKey) {
    const ownerAuth = ownerAuthFetch(documentRef, supabaseUrl, publishableKey);
    const runtime = new SupabaseOwnerRuntimeSnapshotProvider({
      supabaseUrl,
      publishableKey,
      ...(releaseId ? { releaseId } : {}),
      fetcher: ownerAuth.fetcher,
      storage: ownerAuth.storage,
      promptForCredentials: promptForOwnerCredentials,
      onAuthenticated: installOwnerSignOutControl
    });
    return new ManagedOwnerRuntimeProvider({
      inner: runtime,
      storage: ownerAuth.storage,
      supabaseUrl,
      publishableKey,
      fetcher: ownerAuth.fetcher
    });
  }

  return new DisconnectedRuntimeSnapshotProvider();
}
