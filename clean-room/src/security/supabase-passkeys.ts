export type PasskeyMediation = "silent" | "optional" | "required" | "conditional";

export interface PasskeyCredentialApi {
  create(options: CredentialCreationOptions): Promise<Credential | null>;
  get(options?: CredentialRequestOptions): Promise<Credential | null>;
}

export interface SupabasePasskeyClientOptions {
  readonly authBaseUrl: string;
  readonly publishableKey: string;
  readonly fetcher?: typeof fetch;
  readonly credentials?: PasskeyCredentialApi;
}

export interface SupabasePasskeyDescriptor {
  readonly id: string;
  readonly friendlyName?: string;
  readonly createdAt: string;
  readonly lastUsedAt?: string;
}

export interface SupabasePasskeySession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn?: number;
  readonly expiresAt?: number;
  readonly tokenType?: string;
  readonly user: Readonly<Record<string, unknown>>;
}

export interface SupabasePasskeySignInResult {
  readonly session: SupabasePasskeySession;
  readonly user: Readonly<Record<string, unknown>>;
}

export class SupabasePasskeyError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code = "passkey_error", status?: number) {
    super(message);
    this.name = "SupabasePasskeyError";
    this.code = code;
    if (status !== undefined) this.status = status;
  }
}

type JsonRecord = Record<string, unknown>;

interface RegistrationOptionsResponse {
  readonly challengeId: string;
  readonly options: JsonRecord;
}

interface AuthenticationOptionsResponse {
  readonly challengeId: string;
  readonly options: JsonRecord;
}

const MAX_FRIENDLY_NAME_LENGTH = 120;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: JsonRecord, key: string, context: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) throw new SupabasePasskeyError(`${context} is missing ${key}`, "invalid_passkey_payload");
  return value;
}

function optionalString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new SupabasePasskeyError("Supabase returned malformed base64url WebAuthn data", "invalid_passkey_payload");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function deserializeCredentialDescriptor(value: unknown): PublicKeyCredentialDescriptor {
  if (!isRecord(value)) throw new SupabasePasskeyError("Invalid WebAuthn credential descriptor", "invalid_passkey_payload");
  const id = requiredString(value, "id", "WebAuthn credential descriptor");
  const descriptor: PublicKeyCredentialDescriptor = {
    type: "public-key",
    id: base64UrlToBytes(id).buffer as ArrayBuffer
  };
  if (Array.isArray(value.transports)) {
    descriptor.transports = value.transports.filter((entry): entry is AuthenticatorTransport => typeof entry === "string") as AuthenticatorTransport[];
  }
  return descriptor;
}

function deserializeCreationOptions(raw: JsonRecord): PublicKeyCredentialCreationOptions {
  const challenge = requiredString(raw, "challenge", "Passkey registration options");
  if (!isRecord(raw.user)) throw new SupabasePasskeyError("Passkey registration options are missing user", "invalid_passkey_payload");
  const userId = requiredString(raw.user, "id", "Passkey registration user");
  const providerSelection = isRecord(raw.authenticatorSelection) ? raw.authenticatorSelection : {};
  const output: PublicKeyCredentialCreationOptions = {
    ...(raw as unknown as PublicKeyCredentialCreationOptions),
    challenge: base64UrlToBytes(challenge).buffer as ArrayBuffer,
    user: {
      ...(raw.user as unknown as PublicKeyCredentialUserEntity),
      id: base64UrlToBytes(userId).buffer as ArrayBuffer
    },
    authenticatorSelection: {
      ...(providerSelection as unknown as AuthenticatorSelectionCriteria),
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required"
    }
  };
  if (Array.isArray(raw.excludeCredentials) && raw.excludeCredentials.length > 0) {
    output.excludeCredentials = raw.excludeCredentials.map(deserializeCredentialDescriptor);
  } else {
    delete (output as Partial<PublicKeyCredentialCreationOptions>).excludeCredentials;
  }
  return output;
}

function deserializeRequestOptions(raw: JsonRecord): PublicKeyCredentialRequestOptions {
  const challenge = requiredString(raw, "challenge", "Passkey authentication options");
  const output: PublicKeyCredentialRequestOptions = {
    ...(raw as unknown as PublicKeyCredentialRequestOptions),
    challenge: base64UrlToBytes(challenge).buffer as ArrayBuffer,
    userVerification: "required"
  };
  if (Array.isArray(raw.allowCredentials) && raw.allowCredentials.length > 0) {
    output.allowCredentials = raw.allowCredentials.map(deserializeCredentialDescriptor);
  } else {
    delete (output as Partial<PublicKeyCredentialRequestOptions>).allowCredentials;
  }
  return output;
}

function publicKeyCredential(value: Credential | null, ceremony: "registration" | "authentication"): PublicKeyCredential {
  if (!value || value.type !== "public-key") throw new SupabasePasskeyError(`Passkey ${ceremony} did not return a public-key credential`, "webauthn_ceremony_failed");
  const credential = value as PublicKeyCredential;
  if (!credential.response || typeof credential.getClientExtensionResults !== "function") {
    throw new SupabasePasskeyError(`Passkey ${ceremony} returned an invalid credential`, "webauthn_ceremony_failed");
  }
  const attachment = credentialAttachment(credential);
  if (attachment && attachment !== "platform") {
    throw new SupabasePasskeyError("Command Center requires a platform authenticator passkey", "webauthn_platform_required");
  }
  return credential;
}

function credentialAttachment(credential: PublicKeyCredential): string | undefined {
  const value = (credential as PublicKeyCredential & { authenticatorAttachment?: string | null }).authenticatorAttachment;
  return value ?? undefined;
}

function serializeRegistrationCredential(credential: PublicKeyCredential): JsonRecord {
  const native = credential as PublicKeyCredential & { toJSON?: () => unknown };
  if (typeof native.toJSON === "function") {
    const serialized = native.toJSON();
    if (!isRecord(serialized)) throw new SupabasePasskeyError("WebAuthn registration serialization failed", "webauthn_serialization_failed");
    return serialized;
  }
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: credential.id,
    response: {
      attestationObject: bytesToBase64Url(response.attestationObject),
      clientDataJSON: bytesToBase64Url(response.clientDataJSON)
    },
    type: "public-key",
    clientExtensionResults: credential.getClientExtensionResults(),
    ...(credentialAttachment(credential) ? { authenticatorAttachment: credentialAttachment(credential) } : {})
  };
}

function serializeAuthenticationCredential(credential: PublicKeyCredential): JsonRecord {
  const native = credential as PublicKeyCredential & { toJSON?: () => unknown };
  if (typeof native.toJSON === "function") {
    const serialized = native.toJSON();
    if (!isRecord(serialized)) throw new SupabasePasskeyError("WebAuthn authentication serialization failed", "webauthn_serialization_failed");
    return serialized;
  }
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: credential.id,
    response: {
      authenticatorData: bytesToBase64Url(response.authenticatorData),
      clientDataJSON: bytesToBase64Url(response.clientDataJSON),
      signature: bytesToBase64Url(response.signature),
      ...(response.userHandle ? { userHandle: bytesToBase64Url(response.userHandle) } : {})
    },
    type: "public-key",
    clientExtensionResults: credential.getClientExtensionResults(),
    ...(credentialAttachment(credential) ? { authenticatorAttachment: credentialAttachment(credential) } : {})
  };
}

function defaultCredentialApi(): PasskeyCredentialApi {
  if (typeof navigator === "undefined" || !navigator.credentials) throw new SupabasePasskeyError("This browser does not support WebAuthn credentials", "webauthn_not_supported");
  return {
    create: (options) => navigator.credentials.create(options),
    get: (options) => navigator.credentials.get(options)
  };
}

function mapBrowserCeremonyError(error: unknown): SupabasePasskeyError {
  if (error instanceof SupabasePasskeyError) return error;
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return new SupabasePasskeyError("Passkey ceremony was cancelled or not allowed", "webauthn_not_allowed");
    if (error.name === "AbortError") return new SupabasePasskeyError("Passkey ceremony was aborted", "webauthn_aborted");
    if (error.name === "InvalidStateError") return new SupabasePasskeyError("This authenticator is already registered or is not in a valid state", "webauthn_invalid_state");
    if (error.name === "SecurityError") return new SupabasePasskeyError("The current origin is not permitted for this passkey", "webauthn_security_error");
    return new SupabasePasskeyError(error.message || "WebAuthn ceremony failed", `webauthn_${error.name || "error"}`);
  }
  const message = error instanceof Error ? error.message : "WebAuthn ceremony failed";
  return new SupabasePasskeyError(message, "webauthn_ceremony_failed");
}

function parseDescriptor(value: unknown): SupabasePasskeyDescriptor {
  if (!isRecord(value)) throw new SupabasePasskeyError("Supabase returned invalid passkey metadata", "invalid_passkey_payload");
  const id = requiredString(value, "id", "Passkey metadata");
  const createdAt = requiredString(value, "created_at", "Passkey metadata");
  const friendlyName = optionalString(value, "friendly_name");
  const lastUsedAt = optionalString(value, "last_used_at");
  return Object.freeze({
    id,
    createdAt,
    ...(friendlyName ? { friendlyName } : {}),
    ...(lastUsedAt ? { lastUsedAt } : {})
  });
}

function parseSessionPayload(value: unknown): SupabasePasskeySignInResult {
  if (!isRecord(value)) throw new SupabasePasskeyError("Supabase returned an invalid passkey session", "invalid_passkey_payload");
  const rawSession = isRecord(value.session) ? value.session : value;
  const user = isRecord(value.user) ? value.user : isRecord(rawSession.user) ? rawSession.user : undefined;
  if (!user) throw new SupabasePasskeyError("Supabase passkey session is missing user data", "invalid_passkey_payload");
  const accessToken = requiredString(rawSession, "access_token", "Passkey session");
  const refreshToken = requiredString(rawSession, "refresh_token", "Passkey session");
  const expiresIn = optionalNumber(rawSession, "expires_in");
  const expiresAt = optionalNumber(rawSession, "expires_at");
  const tokenType = optionalString(rawSession, "token_type");
  const session: SupabasePasskeySession = Object.freeze({
    accessToken,
    refreshToken,
    user: Object.freeze({ ...user }),
    ...(expiresIn !== undefined ? { expiresIn } : {}),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
    ...(tokenType ? { tokenType } : {})
  });
  return Object.freeze({ session, user: session.user });
}

export class SupabasePasskeyClient {
  readonly #authBaseUrl: string;
  readonly #publishableKey: string;
  readonly #fetcher: typeof fetch;
  readonly #credentials: PasskeyCredentialApi | undefined;
  #ceremonyAbort: AbortController | undefined;

  constructor(options: SupabasePasskeyClientOptions) {
    this.#authBaseUrl = options.authBaseUrl.trim().replace(/\/$/u, "");
    this.#publishableKey = options.publishableKey.trim();
    if (!this.#authBaseUrl) throw new Error("authBaseUrl is required");
    if (!this.#publishableKey.startsWith("sb_publishable_")) throw new Error("A Supabase publishable key is required");
    this.#fetcher = options.fetcher ?? fetch;
    this.#credentials = options.credentials;
  }

  async register(accessToken: string): Promise<SupabasePasskeyDescriptor> {
    if (!accessToken.trim()) throw new SupabasePasskeyError("An authenticated owner session is required to register a passkey", "session_required");
    const started = await this.#startRegistration(accessToken);
    let credential: PublicKeyCredential;
    try {
      credential = publicKeyCredential(await this.#credentialApi().create({ publicKey: deserializeCreationOptions(started.options), signal: this.#newAbortSignal() }), "registration");
    } catch (error) {
      throw mapBrowserCeremonyError(error);
    }
    const payload = await this.#requestJson("POST", "/passkeys/registration/verify", {
      accessToken,
      body: { challenge_id: started.challengeId, credential: serializeRegistrationCredential(credential) }
    });
    return parseDescriptor(payload);
  }

  async signIn(options: Readonly<{ mediation?: PasskeyMediation; captchaToken?: string }> = {}): Promise<SupabasePasskeySignInResult> {
    const started = await this.#startAuthentication(options.captchaToken);
    let credential: PublicKeyCredential;
    try {
      const request: CredentialRequestOptions = { publicKey: deserializeRequestOptions(started.options), signal: this.#newAbortSignal() };
      if (options.mediation) request.mediation = options.mediation;
      credential = publicKeyCredential(await this.#credentialApi().get(request), "authentication");
    } catch (error) {
      throw mapBrowserCeremonyError(error);
    }
    const payload = await this.#requestJson("POST", "/passkeys/authentication/verify", {
      body: { challenge_id: started.challengeId, credential: serializeAuthenticationCredential(credential) }
    });
    return parseSessionPayload(payload);
  }

  async list(accessToken: string): Promise<readonly SupabasePasskeyDescriptor[]> {
    const payload = await this.#requestJson("GET", "/passkeys", { accessToken });
    if (!Array.isArray(payload)) throw new SupabasePasskeyError("Supabase returned an invalid passkey list", "invalid_passkey_payload");
    return Object.freeze(payload.map(parseDescriptor));
  }

  async rename(accessToken: string, passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor> {
    const id = passkeyId.trim();
    const name = friendlyName.trim();
    if (!id) throw new SupabasePasskeyError("Passkey id is required", "invalid_passkey_request");
    if (!name || name.length > MAX_FRIENDLY_NAME_LENGTH) throw new SupabasePasskeyError(`Passkey friendly name must be between 1 and ${MAX_FRIENDLY_NAME_LENGTH} characters`, "invalid_passkey_request");
    const payload = await this.#requestJson("PATCH", `/passkeys/${encodeURIComponent(id)}`, { accessToken, body: { friendly_name: name } });
    return parseDescriptor(payload);
  }

  async remove(accessToken: string, passkeyId: string): Promise<void> {
    const id = passkeyId.trim();
    if (!id) throw new SupabasePasskeyError("Passkey id is required", "invalid_passkey_request");
    await this.#requestJson("DELETE", `/passkeys/${encodeURIComponent(id)}`, { accessToken, allowEmpty: true });
  }

  cancelCeremony(): void {
    if (!this.#ceremonyAbort) return;
    const reason = new Error("Passkey ceremony cancelled by Command Center");
    reason.name = "AbortError";
    this.#ceremonyAbort.abort(reason);
    this.#ceremonyAbort = undefined;
  }

  async #startRegistration(accessToken: string): Promise<RegistrationOptionsResponse> {
    const payload = await this.#requestJson("POST", "/passkeys/registration/options", { accessToken, body: {} });
    if (!isRecord(payload) || !isRecord(payload.options)) throw new SupabasePasskeyError("Supabase returned invalid passkey registration options", "invalid_passkey_payload");
    return Object.freeze({ challengeId: requiredString(payload, "challenge_id", "Passkey registration options"), options: payload.options });
  }

  async #startAuthentication(captchaToken?: string): Promise<AuthenticationOptionsResponse> {
    const security = captchaToken ? { captcha_token: captchaToken } : {};
    const payload = await this.#requestJson("POST", "/passkeys/authentication/options", { body: { gotrue_meta_security: security } });
    if (!isRecord(payload) || !isRecord(payload.options)) throw new SupabasePasskeyError("Supabase returned invalid passkey authentication options", "invalid_passkey_payload");
    return Object.freeze({ challengeId: requiredString(payload, "challenge_id", "Passkey authentication options"), options: payload.options });
  }

  #credentialApi(): PasskeyCredentialApi {
    return this.#credentials ?? defaultCredentialApi();
  }

  #newAbortSignal(): AbortSignal {
    this.cancelCeremony();
    this.#ceremonyAbort = new AbortController();
    return this.#ceremonyAbort.signal;
  }

  async #requestJson(method: string, path: string, options: Readonly<{ accessToken?: string; body?: unknown; allowEmpty?: boolean }> = {}): Promise<unknown> {
    const headers: Record<string, string> = { apikey: this.#publishableKey, accept: "application/json" };
    if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;
    if (options.body !== undefined) headers["content-type"] = "application/json";
    let response: Response;
    try {
      response = await this.#fetcher(`${this.#authBaseUrl}${path}`, {
        method,
        headers,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
        cache: "no-store"
      });
    } catch (error) {
      throw new SupabasePasskeyError(error instanceof Error ? error.message : "Passkey network request failed", "passkey_network_error");
    }
    const raw = await response.text();
    let payload: unknown = undefined;
    if (raw) {
      try { payload = JSON.parse(raw) as unknown; }
      catch { throw new SupabasePasskeyError("Supabase returned a non-JSON passkey response", "invalid_passkey_payload", response.status); }
    }
    if (!response.ok) {
      const record = isRecord(payload) ? payload : {};
      const code = optionalString(record, "error_code") ?? optionalString(record, "code") ?? "passkey_request_failed";
      const message = optionalString(record, "msg") ?? optionalString(record, "message") ?? `Passkey request failed with HTTP ${response.status}`;
      throw new SupabasePasskeyError(message, code, response.status);
    }
    if (!raw && options.allowEmpty) return undefined;
    if (!raw) throw new SupabasePasskeyError("Supabase returned an empty passkey response", "invalid_passkey_payload", response.status);
    return payload;
  }
}
