import { known, unknown } from "../data/canonical.js";
import { classifyConversationIntent, type IntentClassification } from "../brain/conversation.js";
import { SupabasePasskeyClient, type SupabasePasskeyDescriptor } from "../security/supabase-passkeys.js";
import { installOwnerPasskeySettings } from "./owner-security-settings.js";
import { installOwnerSessionSettings, type OwnerSessionDescriptor } from "./owner-session-settings.js";
import type { SessionStorageLike } from "./supabase-owner-provider.js";
import type {
  CommandCenterRuntimeSnapshot,
  RuntimeBrainConversation,
  RuntimeBrainConversationTurn,
  RuntimeBrainProjectWorkspace,
  RuntimeBrainSnapshot,
  RuntimeEvidenceRef,
  RuntimeSurfaceSnapshot
} from "./snapshot.js";

const OWNER_SESSION_KEY = "command-center:owner-session:v1";
const BROKER_REFRESH_SENTINEL = "__command_center_http_only_refresh__";
const BROKER_RESTORE_ACCESS_SENTINEL = "__command_center_restore__";

type JsonRecord = Record<string, unknown>;

export interface BrainTurnWriteResult {
  readonly turnId: string;
  readonly classification: IntentClassification;
}

export interface BrainConversationRuntimeProvider {
  readonly id: string;
  load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
  createBrainConversation(projectId: string | undefined, title: string): Promise<string>;
  recordBrainOwnerTurn(conversationId: string, text: string): Promise<BrainTurnWriteResult>;
}

export interface OwnerSecurityRuntimeProvider extends BrainConversationRuntimeProvider {
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
function numberValue(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? value : typeof value === "string" && value.trim() && Number.isFinite(Number(value)) ? Number(value) : undefined; }
function booleanValue(value: unknown): boolean { return value === true; }
function stringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.map(stringValue).filter((item): item is string => !!item));
}
function runtimeEvidence(source: string, observedAt?: string, reference?: string): readonly RuntimeEvidenceRef[] {
  const value: RuntimeEvidenceRef = Object.freeze({ source, ...(observedAt ? { observedAt } : {}), ...(reference ? { reference } : {}) });
  return Object.freeze([value]);
}

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

export function isBrainConversationRuntimeProvider(value: Readonly<{ id: string; load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot> }>): value is BrainConversationRuntimeProvider {
  const candidate = value as Partial<BrainConversationRuntimeProvider>;
  return typeof candidate.createBrainConversation === "function" && typeof candidate.recordBrainOwnerTurn === "function";
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
    && typeof candidate.revokeOwnerDevice === "function"
    && typeof candidate.createBrainConversation === "function"
    && typeof candidate.recordBrainOwnerTurn === "function";
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
    let resolved = snapshot;
    if (snapshot.connection.state === "connected" || snapshot.connection.state === "degraded") {
      try {
        const brain = await this.#loadBrainSnapshot();
        resolved = this.#withBrainSnapshot(snapshot, brain);
      } catch {
        resolved = this.#withBrainSnapshot(snapshot, Object.freeze({
          availability: "unavailable" as const,
          conversations: Object.freeze([]),
          workspaces: Object.freeze([]),
          evidence: Object.freeze([])
        }));
      }
      setTimeout(() => {
        installOwnerPasskeySettings(this);
        installOwnerSessionSettings(this);
      }, 0);
    }
    return resolved;
  }

  async createBrainConversation(projectId: string | undefined, title: string): Promise<string> {
    const session = this.#currentSession();
    const normalizedProjectId = projectId?.trim() || undefined;
    const normalizedTitle = title.trim();
    if (!normalizedTitle || normalizedTitle.length > 500) throw new Error("Conversation title must be between 1 and 500 characters");
    const payload = await this.#rpcPayload("command_center_brain_create_conversation", session.accessToken, {
      p_project_id: normalizedProjectId ?? null,
      p_title: normalizedTitle
    });
    const conversationId = this.#scalarId(payload, "Brain conversation");
    if (normalizedProjectId) await this.#bindProjectWorkspaceConversation(normalizedProjectId, conversationId, session);
    return conversationId;
  }

  async recordBrainOwnerTurn(conversationId: string, text: string): Promise<BrainTurnWriteResult> {
    const session = this.#currentSession();
    const normalizedConversationId = conversationId.trim();
    const normalizedText = text.trim();
    if (!normalizedConversationId) throw new Error("Conversation id is required");
    if (!normalizedText || normalizedText.length > 12000) throw new Error("Brain input must be between 1 and 12000 characters");
    const classification = classifyConversationIntent(normalizedText);
    const nonce = this.#randomId();
    const contentHash = await this.#sha256(normalizedText);
    const payload = await this.#rpcPayload("command_center_brain_record_turn", session.accessToken, {
      p_conversation_id: normalizedConversationId,
      p_role: "owner",
      p_intent: classification.intent,
      p_protected_action_possible: classification.protectedActionPossible,
      p_redaction_state: "safe_text",
      p_safe_text: normalizedText,
      p_content_ref: `brain:owner-turn:${normalizedConversationId}:${nonce}`,
      p_content_hash: contentHash,
      p_evidence_refs: [],
      p_created_at: new Date().toISOString()
    });
    const turnId = this.#scalarId(payload, "Brain turn");
    await this.#appendProjectWorkspaceTurn(normalizedConversationId, turnId, session);
    return Object.freeze({ turnId, classification });
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

  async #loadBrainSnapshot(): Promise<RuntimeBrainSnapshot> {
    const session = this.#currentSession();
    const [conversationRows, turnRows, workspaceRows] = await Promise.all([
      this.#selectRows("command_center_brain_conversations", session, "conversation_id,project_id,title,state,created_at,updated_at", { order: "updated_at.desc", limit: "200" }),
      this.#selectRows("command_center_brain_conversation_turns", session, "turn_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,safe_text,content_ref,content_hash,evidence_refs,created_at,recorded_at", { order: "created_at.asc,turn_id.asc", limit: "2000" }),
      this.#selectRows("command_center_brain_project_workspaces", session, "project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at,recorded_at", { order: "updated_at.desc", limit: "500" })
    ]);

    const turnsByConversation = new Map<string, RuntimeBrainConversationTurn[]>();
    for (const row of turnRows) {
      const id = stringValue(row.turn_id);
      const conversationId = stringValue(row.conversation_id);
      const projectId = stringValue(row.project_id);
      const role = stringValue(row.role);
      const intent = stringValue(row.intent);
      const protectedActionPossible = row.protected_action_possible === true;
      const redactionState = stringValue(row.redaction_state);
      const safeText = stringValue(row.safe_text);
      const contentRef = stringValue(row.content_ref);
      const contentHash = stringValue(row.content_hash);
      const createdAt = stringValue(row.created_at);
      const recordedAt = stringValue(row.recorded_at) ?? createdAt;
      if (!id || !conversationId || !role || !["owner", "brain", "system"].includes(role) || !redactionState || !["safe_text", "redacted", "reference_only"].includes(redactionState) || !contentRef || !contentHash || !/^[a-f0-9]{64}$/u.test(contentHash) || !createdAt) {
        throw new Error("Brain conversation turn is malformed");
      }
      if (redactionState === "safe_text" && !safeText) throw new Error("Brain safe-text turn is missing content");
      const evidenceRefs = stringArray(row.evidence_refs);
      const evidence = evidenceRefs.length
        ? Object.freeze(evidenceRefs.map((reference) => Object.freeze({ source: "supabase:command_center_brain_conversation_turns", observedAt: recordedAt, reference })))
        : runtimeEvidence("supabase:command_center_brain_conversation_turns", recordedAt, id);
      const turn: RuntimeBrainConversationTurn = Object.freeze({
        id,
        conversationId,
        ...(projectId ? { projectId } : {}),
        role: role as RuntimeBrainConversationTurn["role"],
        ...(intent ? { intent } : {}),
        protectedActionPossible,
        redactionState: redactionState as RuntimeBrainConversationTurn["redactionState"],
        content: redactionState === "safe_text" ? known(safeText as string) : unknown<string>(),
        contentRef,
        createdAt,
        evidence
      });
      const list = turnsByConversation.get(conversationId) ?? [];
      list.push(turn);
      turnsByConversation.set(conversationId, list);
    }

    const conversations: RuntimeBrainConversation[] = conversationRows.map((row) => {
      const id = stringValue(row.conversation_id);
      const projectId = stringValue(row.project_id);
      const title = stringValue(row.title);
      const state = stringValue(row.state);
      const createdAt = stringValue(row.created_at);
      const updatedAt = stringValue(row.updated_at);
      if (!id || !title || !state || !["active", "closed"].includes(state) || !createdAt || !updatedAt) throw new Error("Brain conversation is malformed");
      const turns = Object.freeze([...(turnsByConversation.get(id) ?? [])]);
      if (turns.some((turn) => turn.projectId !== projectId)) throw new Error("Brain conversation turn project scope mismatch");
      return Object.freeze({
        id,
        ...(projectId ? { projectId } : {}),
        title,
        state: state as RuntimeBrainConversation["state"],
        createdAt,
        updatedAt,
        turns,
        evidence: runtimeEvidence("supabase:command_center_brain_conversations", updatedAt, id)
      });
    });
    const conversationById = new Map(conversations.map((conversation) => [conversation.id, conversation]));

    const workspaces: RuntimeBrainProjectWorkspace[] = workspaceRows.map((row) => {
      const projectId = stringValue(row.project_id);
      const version = numberValue(row.version);
      const specVersion = numberValue(row.spec_version);
      const conversationId = stringValue(row.conversation_id);
      const executionRunId = stringValue(row.execution_run_id);
      const updatedAt = stringValue(row.updated_at);
      const recordedAt = stringValue(row.recorded_at) ?? updatedAt;
      if (!projectId || !version || version < 1 || !specVersion || specVersion < 1 || !updatedAt) throw new Error("Brain project workspace is malformed");
      if (conversationId) {
        const conversation = conversationById.get(conversationId);
        if (!conversation || conversation.projectId !== projectId) throw new Error("Brain project workspace conversation scope mismatch");
      }
      const turnIds = stringArray(row.turn_ids);
      if (new Set(turnIds).size !== turnIds.length) throw new Error("Brain project workspace has duplicate turn ids");
      return Object.freeze({
        projectId,
        version,
        specVersion,
        conversationId: conversationId ? known(conversationId) : unknown<string>(),
        turnIds,
        decisionRefs: stringArray(row.decision_refs),
        executionRunId: executionRunId ? known(executionRunId) : unknown<string>(),
        blockerRefs: stringArray(row.blocker_refs),
        evidenceRefs: stringArray(row.evidence_refs),
        verifiedResultRefs: stringArray(row.verified_result_refs),
        updatedAt,
        evidence: runtimeEvidence("supabase:command_center_brain_project_workspaces", recordedAt, projectId)
      });
    });

    return Object.freeze({
      availability: "available" as const,
      conversations: Object.freeze(conversations),
      workspaces: Object.freeze(workspaces),
      evidence: Object.freeze([
        ...runtimeEvidence("supabase:command_center_brain_conversations"),
        ...runtimeEvidence("supabase:command_center_brain_project_workspaces")
      ])
    });
  }

  #withBrainSnapshot(snapshot: CommandCenterRuntimeSnapshot, brain: RuntimeBrainSnapshot): CommandCenterRuntimeSnapshot {
    const brainSurface: RuntimeSurfaceSnapshot = brain.availability === "available"
      ? Object.freeze({
          key: "brain",
          label: "Brain",
          availability: "available" as const,
          summary: known(`${brain.conversations.length} persistent Brain conversation${brain.conversations.length === 1 ? "" : "s"} · ${brain.workspaces.length} project workspace${brain.workspaces.length === 1 ? "" : "s"}.`),
          evidence: brain.evidence
        })
      : Object.freeze({ key: "brain", label: "Brain", availability: brain.availability, summary: unknown<string>(), evidence: brain.evidence });
    const surfaces = snapshot.surfaces.map((surface) => surface.key === "brain" ? brainSurface : surface);
    return Object.freeze({ ...snapshot, brain, surfaces: Object.freeze(surfaces) });
  }

  async #bindProjectWorkspaceConversation(projectId: string, conversationId: string, session: StoredOwnerSession): Promise<void> {
    const existing = (await this.#selectRows("command_center_brain_project_workspaces", session, "project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at", { project_id: `eq.${projectId}`, limit: "1" }))[0];
    const bound = stringValue(existing?.conversation_id);
    if (bound && bound !== conversationId) throw new Error("Project workspace is already bound to a different conversation");
    await this.#saveWorkspace(projectId, conversationId, existing, stringArray(existing?.turn_ids), session);
  }

  async #appendProjectWorkspaceTurn(conversationId: string, turnId: string, session: StoredOwnerSession): Promise<void> {
    const conversation = (await this.#selectRows("command_center_brain_conversations", session, "conversation_id,project_id", { conversation_id: `eq.${conversationId}`, limit: "1" }))[0];
    const projectId = stringValue(conversation?.project_id);
    if (!projectId) return;
    const existing = (await this.#selectRows("command_center_brain_project_workspaces", session, "project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at", { project_id: `eq.${projectId}`, limit: "1" }))[0];
    const bound = stringValue(existing?.conversation_id);
    if (bound && bound !== conversationId) throw new Error("Project workspace conversation changed before turn commit");
    const turnIds = [...stringArray(existing?.turn_ids)];
    if (!turnIds.includes(turnId)) turnIds.push(turnId);
    await this.#saveWorkspace(projectId, conversationId, existing, Object.freeze(turnIds), session);
  }

  async #saveWorkspace(projectId: string, conversationId: string, existing: JsonRecord | undefined, turnIds: readonly string[], session: StoredOwnerSession): Promise<void> {
    await this.#rpcPayload("command_center_brain_save_project_workspace", session.accessToken, {
      p_project_id: projectId,
      p_expected_version: existing ? numberValue(existing.version) ?? 0 : 0,
      p_spec_version: existing ? numberValue(existing.spec_version) ?? 1 : 1,
      p_conversation_id: conversationId,
      p_turn_ids: turnIds,
      p_decision_refs: stringArray(existing?.decision_refs),
      p_execution_run_id: stringValue(existing?.execution_run_id) ?? null,
      p_blocker_refs: stringArray(existing?.blocker_refs),
      p_evidence_refs: stringArray(existing?.evidence_refs),
      p_verified_result_refs: stringArray(existing?.verified_result_refs),
      p_updated_at: new Date().toISOString()
    });
  }

  async #selectRows(table: string, session: StoredOwnerSession, select: string, params: Readonly<Record<string, string>> = {}): Promise<readonly JsonRecord[]> {
    const url = new URL(`${this.#supabaseUrl}/rest/v1/${table}`);
    url.searchParams.set("select", select);
    url.searchParams.set("owner_id", `eq.${session.userId}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await this.#fetcher(url, {
      method: "GET",
      headers: { apikey: this.#publishableKey, authorization: `Bearer ${session.accessToken}`, accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Brain source ${table} is unavailable`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload) || !payload.every(isRecord)) throw new Error(`Brain source ${table} returned an invalid payload`);
    return Object.freeze(payload);
  }

  async #freshProtectedAuthorization(action: string, resourceType: string, resourceId: string, riskLevel: "high" | "critical", reason: string): Promise<FreshAuthorization> {
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
      catch { throw new Error(`RPC ${name} returned invalid JSON`); }
    }
    if (!response.ok) {
      const record = isRecord(payload) ? payload : {};
      throw new Error(stringValue(record.message) ?? stringValue(record.msg) ?? `RPC ${name} failed`);
    }
    return payload;
  }

  #scalarId(payload: unknown, label: string): string {
    const direct = stringValue(payload);
    if (direct) return direct;
    if (isRecord(payload)) {
      const candidate = stringValue(payload.id) ?? stringValue(payload.conversation_id) ?? stringValue(payload.turn_id);
      if (candidate) return candidate;
    }
    throw new Error(`${label} RPC did not return an id`);
  }

  async #sha256(value: string): Promise<string> {
    if (!globalThis.crypto?.subtle) throw new Error("Secure content hashing is unavailable");
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  #randomId(): string {
    if (!globalThis.crypto?.randomUUID) throw new Error("Secure idempotency identity is unavailable");
    return globalThis.crypto.randomUUID();
  }
}
