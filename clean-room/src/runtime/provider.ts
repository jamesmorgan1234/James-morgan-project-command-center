import { createDisconnectedRuntimeSnapshot, type CommandCenterRuntimeSnapshot } from "./snapshot.js";
import { installOwnerSignOutControl, promptForOwnerCredentials } from "./owner-auth-ui.js";
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

function ownerAuthFetch(documentRef: Document, supabaseUrl: string, publishableKey: string): { fetcher: typeof fetch; storage: SessionStorageLike } {
  let page: URL | undefined;
  try { page = new URL(documentRef.baseURI); } catch {}
  const useVercelProxy = page?.protocol === "https:" && page.hostname.endsWith(".vercel.app");
  const useSessionBroker = useVercelProxy;
  const upstreamAuthBase = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/`;
  const proxyAuthBase = page ? new URL("/__cc_auth__/", page).toString() : "";
  const brokerUrl = page ? new URL("/api/owner-session", page).toString() : "";
  const storage = new EphemeralOwnerSessionStorage(useSessionBroker);

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
      return jsonResponse(sessionPayloadWithBrokerSentinel(payload), response.status);
    }
    const established = await broker("establish", refreshToken);
    if (!established.ok) return established;
    const brokerPayload: unknown = await established.json();
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
    return new SupabaseOwnerRuntimeSnapshotProvider({
      supabaseUrl,
      publishableKey,
      ...(releaseId ? { releaseId } : {}),
      fetcher: ownerAuth.fetcher,
      storage: ownerAuth.storage,
      promptForCredentials: promptForOwnerCredentials,
      onAuthenticated: installOwnerSignOutControl
    });
  }

  return new DisconnectedRuntimeSnapshotProvider();
}
