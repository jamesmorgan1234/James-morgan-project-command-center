import { SupabasePasskeyClient, type SupabasePasskeyDescriptor } from "../security/supabase-passkeys.js";
import { installOwnerPasskeySettings } from "./owner-security-settings.js";
import { installOwnerSessionSettings, type OwnerSessionDescriptor } from "./owner-session-settings.js";
import type { SessionStorageLike } from "./supabase-owner-provider.js";
import type { CommandCenterRuntimeSnapshot } from "./snapshot.js";

const OWNER_SESSION_KEY = "command-center:owner-session:v1";
const BROKER_REFRESH_SENTINEL = "__command_center_http_only_refresh__";
const BROKER_RESTORE_ACCESS_SENTINEL = "__command_center_restore__";

type JsonRecord = Record<string, unknown>;

export interface OwnerSecurityRuntimeProvider {
  readonly id: string;
  load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  listOwnerPasskeys(): Promise<readonly SupabasePasskeyDescriptor[]>;
  registerOwnerPasskey(): Promise<SupabasePasskeyDescriptor>;
  renameOwnerPasskey(passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor>;
  removeOwnerPasskey(passkeyId: string): Promise<void>;
  listOwnerSessions(): Promise<readonly OwnerSessionDescriptor[]>;
  revokeOwnerSession(sessionId: string): Promise<void>;
  revokeOwnerDevice(deviceId: string): Promise<void>;
}

interface RuntimeProviderLike {
  readonly id: string;
  load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

interface StoredOwnerSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly userId: string;
}

interface FreshAuthorization {
  readonly session: StoredOwnerSession;
  readonly authorizationId: string;
}

function isRecord(value: unknown): value is JsonRecord { return typeof value === "object" && value !== null && !Array.isArray(value); }
function stringValue(value: unknown): string | undefined { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function numberValue(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : undefined; }
function booleanValue(value: unknown): boolean { return value === true; }

function sessionDescriptor(value: unknown): OwnerSessionDescriptor {
  if (!isRecord(value)) throw new Error("Owner session inventory returned an invalid row");
  const sessionId = stringValue(value.session_id);
  const deviceLabel = stringValue(value.device_label);
  const trustState = stringValue(value.trust_state);
  const assurance = stringValue(value.assurance);
  const sessionCreatedAt = stringValue(value.session_created_at);
  const lastSeenAt = stringValue(value.last_seen_at);
  if (!sessionId || !deviceLabel || !trustState || !assurance || !sessionCreatedAt || !lastSeenAt) {
    throw new Error("Owner session inventory row is incomplete");
  }
  const deviceId = stringValue(value.device_id);
  const platform = stringValue(value.platform);
  const notAfter = stringValue(value.not_after);
  const revokedAt = stringValue(value.revoked_at);
  const revokedReason = stringValue(value.revoked_reason);
  return Object.freeze({
    sessionId,
    deviceLabel,
    trustState,
    assurance,
    sessionCreatedAt,
    lastSeenAt,
    isCurrent: booleanValue(value.is_current),
    ...(deviceId ? { deviceId } : {}),
    ...(platform ? { platform } : {}),
    ...(notAfter ? { notAfter } : {}),
    ...(revokedAt ? { revokedAt } : {}),
    ...(revokedReason ? { revokedReason } : {})
  });
}

export function isOwnerSecurityRuntimeProvider(value: RuntimeProviderLike): value is RuntimeProviderLike & OwnerSecurityRuntimeProvider {
  const candidate = value as Partial<OwnerSecurityRuntimeProvider>;
  return typeof candidate.signIn === "function"
    && typeof candidate.signOut === "function"
    && typeof candidate.listOwnerPasskeys === "function"
    && typeof candidate.registerOwnerPasskey === "function"
    && typeof candidate.renameOwnerPasskey === "function"
    && typeof candidate.removeOwnerPasskey === "function"
    && typeof candidate.listOwnerSessions === "function"
    && typeof candidate.revokeOwnerSession === "function"
    && typeof candidate.revokeOwnerDevice === "function";
}

export class ManagedOwnerRuntimeProvider implements OwnerSecurityRuntimeProvider {
  readonly id: string;
  readonly #inner: RuntimeProviderLike;
  readonly #storage: SessionStorageLike;
  readonly #supabaseUrl: string;
  readonly #publishableKey: string;
  readonly #fetcher: typeof fetch;
  readonly #passkeys: SupabasePasskeyClient;

  constructor(options: Readonly<{
    inner: RuntimeProviderLike;
    storage: SessionStorageLike;
    supabaseUrl: string;
    publishableKey: string;
    fetcher: typeof fetch;
  }>) {
    this.#inner = options.inner;
    this.id = options.inner.id;
    this.#storage = options.storage;
    this.#supabaseUrl = options.supabaseUrl.replace(/\/$/u, "");
    this.#publishableKey = options.publishableKey;
    this.#fetcher = options.fetcher;
    this.#passkeys = new SupabasePasskeyClient({
      authBaseUrl: `${this.#supabaseUrl}/auth/v1`,
      publishableKey: this.#publishableKey,
      fetcher: this.#fetcher
    });
  }

  signIn(email: string, password: string): Promise<void> {
    return this.#inner.signIn(email, password);
  }

  signOut(): Promise<void> {
    return this.#inner.signOut();
  }

  async load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot> {
    const snapshot = await this.#inner.load(signal);
    if (snapshot.connection.state === "connected" || snapshot.connection.state === "degraded") {
      setTimeout(() => {
        installOwnerPasskeySettings(this);
        installOwnerSessionSettings(this);
      }, 0);
    }
    return snapshot;
  }

  async listOwnerPasskeys(): Promise<readonly SupabasePasskeyDescriptor[]> {
    const session = this.#currentSession();
    return this.#passkeys.list(session.accessToken);
  }

  async registerOwnerPasskey(): Promise<SupabasePasskeyDescriptor> {
    const session = this.#currentSession();
    return this.#passkeys.register(session.accessToken);
  }

  async renameOwnerPasskey(passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor> {
    const session = this.#currentSession();
    return this.#passkeys.rename(session.accessToken, passkeyId, friendlyName);
  }

  async removeOwnerPasskey(passkeyId: string): Promise<void> {
    const id = passkeyId.trim();
    if (!id) throw new Error("Passkey id is required");
    const fresh = await this.#freshProtectedAuthorization(
      "security.passkey.remove", "passkey", id, "critical", "Owner initiated passkey removal"
    );
    await this.#rpc("command_center_security_consume_passkey_removal", fresh.session.accessToken, {
      p_authorization_id: fresh.authorizationId,
      p_passkey_id: id
    });
    await this.#passkeys.remove(fresh.session.accessToken, id);
  }

  async listOwnerSessions(): Promise<readonly OwnerSessionDescriptor[]> {
    const session = this.#currentSession();
    const rows = await this.#rpcRows("command_center_list_owner_sessions", session.accessToken, {});
    return Object.freeze(rows.map(sessionDescriptor));
  }

  async revokeOwnerSession(sessionId: string): Promise<void> {
    const id = sessionId.trim();
    if (!id) throw new Error("Session id is required");
    const fresh = await this.#freshProtectedAuthorization(
      "security.revoke_session", "owner_session", id, "high", "Owner initiated session revocation"
    );
    await this.#rpc("command_center_revoke_owner_session_authorized", fresh.session.accessToken, {
      p_session_id: id,
      p_authorization_id: fresh.authorizationId,
      p_reason: "owner_revoked_from_security_settings"
    });
  }

  async revokeOwnerDevice(deviceId: string): Promise<void> {
    const id = deviceId.trim();
    if (!id) throw new Error("Device id is required");
    const fresh = await this.#freshProtectedAuthorization(
      "security.revoke_device", "owner_device", id, "critical", "Owner initiated device revocation"
    );
    await this.#rpc("command_center_revoke_owner_device_authorized", fresh.session.accessToken, {
      p_device_id: id,
      p_authorization_id: fresh.authorizationId,
      p_reason: "owner_revoked_device_from_security_settings"
    });
  }

  async #freshProtectedAuthorization(action: string, resourceType: string, resourceId: string, riskLevel: "high" | "critical", reason: string): Promise<FreshAuthorization> {
    // Unsupported/failed platform verification never falls through to a weaker protected-action path.
    const verified = await this.#passkeys.signIn({ mediation: "required" });
    const freshSession = this.#storeFreshPasskeySession(verified.session, verified.user);
    const authorization = await this.#rpc("command_center_security_authorize_action", freshSession.accessToken, {
      p_action_key: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_risk_level: riskLevel,
      p_reason: reason,
      p_expires_at: null,
      p_idempotency_key: `${action}:${this.#randomId()}`
    });
    const authorizationId = stringValue(authorization.authorization_id);
    if (!authorizationId) throw new Error("Security authorization did not return an authorization id");
    return Object.freeze({ session: freshSession, authorizationId });
  }

  #currentSession(): StoredOwnerSession {
    const raw = this.#storage.getItem(OWNER_SESSION_KEY);
    if (!raw) throw new Error("An authenticated owner session is required");
    let parsed: unknown;
    try { parsed = JSON.parse(raw) as unknown; }
    catch { throw new Error("Owner session state is invalid"); }
    if (!isRecord(parsed)) throw new Error("Owner session state is invalid");
    const accessToken = stringValue(parsed.accessToken);
    const refreshToken = stringValue(parsed.refreshToken);
    const userId = stringValue(parsed.userId);
    const expiresAt = numberValue(parsed.expiresAt);
    if (!accessToken || !refreshToken || !userId || !expiresAt) throw new Error("Owner session state is incomplete");
    if (accessToken === BROKER_RESTORE_ACCESS_SENTINEL) throw new Error("Owner session has not been restored yet");
    if (expiresAt <= Math.floor(Date.now() / 1000)) throw new Error("Owner session is expired");
    return Object.freeze({ accessToken, refreshToken, userId, expiresAt });
  }

  #storeFreshPasskeySession(session: Readonly<{ accessToken: string; refreshToken: string; expiresIn?: number; expiresAt?: number }>, user: Readonly<Record<string, unknown>>): StoredOwnerSession {
    const userId = stringValue(user.id);
    const expiresAt = session.expiresAt ?? (session.expiresIn ? Math.floor(Date.now() / 1000) + session.expiresIn : undefined);
    if (!userId || !expiresAt || !session.accessToken) throw new Error("Fresh passkey session is incomplete");
    const stored = Object.freeze({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken || BROKER_REFRESH_SENTINEL,
      expiresAt,
      userId
    });
    this.#storage.setItem(OWNER_SESSION_KEY, JSON.stringify(stored));
    return stored;
  }

  async #rpc(name: string, accessToken: string, body: JsonRecord): Promise<JsonRecord> {
    const payload = await this.#rpcPayload(name, accessToken, body);
    if (!isRecord(payload)) throw new Error(`Security RPC ${name} returned an invalid response`);
    return payload;
  }

  async #rpcRows(name: string, accessToken: string, body: JsonRecord): Promise<readonly JsonRecord[]> {
    const payload = await this.#rpcPayload(name, accessToken, body);
    if (!Array.isArray(payload) || !payload.every(isRecord)) throw new Error(`Security RPC ${name} returned an invalid row set`);
    return Object.freeze(payload);
  }

  async #rpcPayload(name: string, accessToken: string, body: JsonRecord): Promise<unknown> {
    const response = await this.#fetcher(`${this.#supabaseUrl}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: this.#publishableKey,
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });
    const raw = await response.text();
    let payload: unknown = {};
    if (raw) {
      try { payload = JSON.parse(raw) as unknown; }
      catch { throw new Error(`Security RPC ${name} returned invalid JSON`); }
    }
    if (!response.ok) {
      const record = isRecord(payload) ? payload : {};
      throw new Error(stringValue(record.message) ?? stringValue(record.msg) ?? `Security RPC ${name} failed`);
    }
    return payload;
  }

  #randomId(): string {
    if (!globalThis.crypto?.randomUUID) throw new Error("Secure idempotency identity is unavailable");
    return globalThis.crypto.randomUUID();
  }
}
