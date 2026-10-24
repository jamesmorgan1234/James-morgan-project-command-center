import { SupabasePasskeyClient, type SupabasePasskeyDescriptor } from "../security/supabase-passkeys.js";
import type { SessionStorageLike } from "./supabase-owner-provider.js";
import type { CommandCenterRuntimeSnapshot } from "./snapshot.js";

const OWNER_SESSION_KEY = "command-center:owner-session:v1";
const BROKER_REFRESH_SENTINEL = "__command_center_http_only_refresh__";
const BROKER_RESTORE_ACCESS_SENTINEL = "__command_center_restore__";

type JsonRecord = Record<string, unknown>;

export interface OwnerSecurityRuntimeProvider {
  readonly id: string;
  load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
  listOwnerPasskeys(): Promise<readonly SupabasePasskeyDescriptor[]>;
  registerOwnerPasskey(): Promise<SupabasePasskeyDescriptor>;
  renameOwnerPasskey(passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor>;
  removeOwnerPasskey(passkeyId: string): Promise<void>;
}

interface RuntimeProviderLike {
  readonly id: string;
  load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
}

interface StoredOwnerSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly userId: string;
}

function isRecord(value: unknown): value is JsonRecord { return typeof value === "object" && value !== null && !Array.isArray(value); }
function stringValue(value: unknown): string | undefined { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function numberValue(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : undefined; }

export function isOwnerSecurityRuntimeProvider(value: RuntimeProviderLike): value is RuntimeProviderLike & OwnerSecurityRuntimeProvider {
  const candidate = value as Partial<OwnerSecurityRuntimeProvider>;
  return typeof candidate.listOwnerPasskeys === "function"
    && typeof candidate.registerOwnerPasskey === "function"
    && typeof candidate.renameOwnerPasskey === "function"
    && typeof candidate.removeOwnerPasskey === "function";
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

  load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot> { return this.#inner.load(signal); }

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

    // Credential removal is a protected security action. Require an immediate platform-UV
    // ceremony, replace the broker with that fresh session, then cross the canonical policy
    // and single-use authorization gate before deleting the credential at the auth provider.
    const verified = await this.#passkeys.signIn({ mediation: "required" });
    const fresh = this.#storeFreshPasskeySession(verified.session, verified.user);
    const authorization = await this.#rpc("command_center_security_authorize_action", fresh.accessToken, {
      p_action_key: "security.passkey.remove",
      p_resource_type: "passkey",
      p_resource_id: id,
      p_risk_level: "critical",
      p_reason: "Owner initiated passkey removal",
      p_expires_at: null,
      p_idempotency_key: `passkey-remove:${this.#randomId()}`
    });
    const authorizationId = stringValue(authorization.authorization_id);
    if (!authorizationId) throw new Error("Security authorization did not return an authorization id");

    await this.#rpc("command_center_security_consume_passkey_removal", fresh.accessToken, {
      p_authorization_id: authorizationId,
      p_passkey_id: id
    });
    await this.#passkeys.remove(fresh.accessToken, id);
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
    if (!isRecord(payload)) throw new Error(`Security RPC ${name} returned an invalid response`);
    return payload;
  }

  #randomId(): string {
    if (!globalThis.crypto?.randomUUID) throw new Error("Secure idempotency identity is unavailable");
    return globalThis.crypto.randomUUID();
  }
}
