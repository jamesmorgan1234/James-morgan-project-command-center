import { invokeExecutionGateway } from "./execution-gateway.js";
import { preparedCompanyId, validateCompanyBuildStart, type CompanyBuildStartView } from "./company-build-start.js";
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
  RuntimeBrainImprovementProposal,
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
  requestBrainResponse(conversationId: string, ownerTurnId: string): Promise<string>;
  decideBrainImprovement(improvementId: string, decision: "accepted" | "rejected"): Promise<void>;
  convertBrainImprovementToScopeRequest(improvement: RuntimeBrainImprovementProposal): Promise<string>;
}

export interface ProjectWorkspaceRuntimeProvider {
  saveProjectRecord(projectId: string, kind: "decision" | "asset_reference" | "integration_request", title: string, detail: string, url?: string, requestId?: string): Promise<string>;
  createProjectAgencyRun(projectId: string, objective: string, requestId?: string): Promise<string>;
  readCompanyBuildStart?(projectId: string): Promise<CompanyBuildStartView>;
  stopProjectAgencyRun(projectId: string, runId: string, generation: number): Promise<void>;
  continueProjectAgencyRun?(projectId: string, runId: string, generation: number): Promise<void>;
}
export function isProjectWorkspaceRuntimeProvider(value: unknown): value is ProjectWorkspaceRuntimeProvider {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProjectWorkspaceRuntimeProvider>;
  return typeof candidate.saveProjectRecord === "function" && typeof candidate.createProjectAgencyRun === "function" && typeof candidate.stopProjectAgencyRun === "function";
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

const IMPROVEMENT_AREAS = new Set(["roadmap_gap", "manual_work", "fragility", "provider", "cost", "security", "historical_lesson", "quality"]);
const IMPROVEMENT_STATES = new Set(["proposed", "accepted", "rejected", "converted_to_scope"]);

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
  return typeof candidate.createBrainConversation === "function"
    && typeof candidate.recordBrainOwnerTurn === "function"
    && typeof candidate.requestBrainResponse === "function"
    && typeof candidate.decideBrainImprovement === "function"
    && typeof candidate.convertBrainImprovementToScopeRequest === "function";
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
    && typeof candidate.recordBrainOwnerTurn === "function"
    && typeof candidate.requestBrainResponse === "function"
    && typeof candidate.decideBrainImprovement === "function"
    && typeof candidate.convertBrainImprovementToScopeRequest === "function";
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

  watchChanges(onChanged: () => void): () => void {
    const realtime = this.#inner as RuntimeProviderLike & { watchChanges?: (listener: () => void) => () => void };
    return realtime.watchChanges?.(onChanged) ?? (() => undefined);
  }

  /** Owner-scoped, status-only progress write. Existing scope and denominator
   * are never changed; accepted evidence is preserved and read back. */
  async recordVerifiedProjectWorkUnit(
    projectId: string, roadmapVersion: number, workUnitId: string, evidenceRefs: readonly string[]
  ): Promise<void> {
    const project = projectId.trim();
    const unit = workUnitId.trim();
    const evidence = [...new Set(evidenceRefs.map((value) => value.trim()).filter(Boolean))];
    if (!project || !unit || !Number.isSafeInteger(roadmapVersion) || roadmapVersion < 1 || evidence.length === 0)
      throw new Error("Verified work unit requires existing project, current roadmap, work-unit ID and evidence");
    const session = this.#currentSession();
    const headers = {
      apikey: this.#publishableKey,
      authorization: `Bearer ${session.accessToken}`,
      accept: "application/json"
    };
    const roadmapParams = new URLSearchParams({
      owner_id: `eq.${session.userId}`,
      project_id: `eq.${project}`,
      version: `eq.${roadmapVersion}`,
      state: "eq.current",
      select: "project_id,version,state"
    });
    const roadmapResponse = await this.#fetcher(
      `${this.#supabaseUrl}/rest/v1/command_center_project_roadmaps?${roadmapParams}`,
      { headers, cache: "no-store" }
    );
    const roadmapRows: unknown = roadmapResponse.ok ? await roadmapResponse.json() : null;
    if (!Array.isArray(roadmapRows) || roadmapRows.length !== 1)
      throw new Error("The requested roadmap is not the owner's current canonical version");

    const unitParams = new URLSearchParams({
      owner_id: `eq.${session.userId}`,
      project_id: `eq.${project}`,
      roadmap_version: `eq.${roadmapVersion}`,
      work_unit_id: `eq.${unit}`,
      select: "work_unit_id,status,evidence_refs"
    });
    const url = `${this.#supabaseUrl}/rest/v1/command_center_project_work_units?${unitParams}`;
    const getRows = async (): Promise<JsonRecord[]> => {
      const response = await this.#fetcher(url, { headers, cache: "no-store" });
      if (!response.ok) throw new Error("Canonical project work-unit read failed");
      const payload: unknown = await response.json();
      if (!Array.isArray(payload) || payload.length !== 1 || !isRecord(payload[0]))
        throw new Error("Canonical work unit is missing or ambiguous");
      return payload as JsonRecord[];
    };
    const existing = (await getRows())[0]!;
    const merged = [...new Set([...stringArray(existing.evidence_refs), ...evidence])];
    const patch = await this.#fetcher(url, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({ status: "verified", evidence_refs: merged, updated_at: new Date().toISOString() }),
      cache: "no-store"
    });
    if (!patch.ok) throw new Error("Authenticated work-unit progress write was rejected");
    const persisted = (await getRows())[0]!;
    if (persisted.status !== "verified" || !merged.every((reference) => stringArray(persisted.evidence_refs).includes(reference)))
      throw new Error("Verified work-unit progress did not persist with all evidence");
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
          improvements: Object.freeze([]),
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

  async decideBrainImprovement(improvementId: string, decision: "accepted" | "rejected"): Promise<void> {
    const id = improvementId.trim();
    if (!id) throw new Error("Improvement id is required");
    if (decision !== "accepted" && decision !== "rejected") throw new Error("Improvement decision must be accepted or rejected");
    const session = this.#currentSession();
    const ownerDecisionRef = `brain:owner-improvement-decision:${id}:${decision}:${this.#randomId()}`;
    await this.#rpcPayload("command_center_brain_decide_improvement", session.accessToken, {
      p_improvement_id: id,
      p_expected_state: "proposed",
      p_decision: decision,
      p_owner_decision_ref: ownerDecisionRef,
      p_evidence_refs: [ownerDecisionRef]
    });
  }

  async convertBrainImprovementToScopeRequest(improvement: RuntimeBrainImprovementProposal): Promise<string> {
    if (improvement.state !== "accepted") throw new Error("Only an accepted improvement may become a scope request");
    if (!/^[a-f0-9]{64}$/u.test(improvement.detailHash)) throw new Error("Improvement detail hash is invalid");
    const session = this.#currentSession();
    const ownerDecisionRef = `brain:owner-improvement-scope:${improvement.id}:${this.#randomId()}`;
    const evidenceRefs = Object.freeze([...new Set([...improvement.evidenceRefs, ownerDecisionRef])]);
    const payload = await this.#rpcPayload("command_center_brain_convert_improvement_to_scope_request", session.accessToken, {
      p_improvement_id: improvement.id,
      p_expected_state: "accepted",
      p_proposed_roadmap_parent_ref: null,
      p_scope_ref: improvement.detailRef,
      p_scope_hash: improvement.detailHash,
      p_owner_decision_ref: ownerDecisionRef,
      p_evidence_refs: evidenceRefs
    });
    return this.#scalarId(payload, "Improvement scope request");
  }

  async #assertProject(projectId: string): Promise<StoredOwnerSession> {
    const session = this.#currentSession();
    const rows = await this.#selectRows("command_center_project_profiles", session, "project_id,lifecycle", { project_id: `eq.${projectId}`, limit: "1" });
    if (!rows.some(row => row.project_id === projectId)) throw new Error("Project is not available in this owner account");
    return session;
  }

  async saveProjectRecord(projectId: string, kind: "decision" | "asset_reference" | "integration_request", title: string, detail: string, url?: string, requestId?: string): Promise<string> {
    if (!["decision", "asset_reference", "integration_request"].includes(kind)) throw new Error("Unsupported project record");
    if (!projectId.trim() || !title.trim() || title.trim().length > 500 || detail.length > 12000) throw new Error("A project and title are required; details must be under 12,000 characters");
    if (url?.trim()) {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:" || parsed.username || parsed.password || [...parsed.searchParams.keys()].some(key => /token|secret|password|api.?key/i.test(key))) throw new Error("Use a secure reference URL without credentials or secret query parameters");
    }
    const session = await this.#assertProject(projectId);
    const nonce = requestId ?? this.#randomId();
    if (!/^[a-f0-9-]{36}$/i.test(nonce)) throw new Error("Invalid request identity");
    const id = `${kind}:${nonce}`;
    const existing = await this.#selectRows("command_center_canonical_entities", session, "entity_id,project_id,payload", { entity_id: `eq.${id}`, limit: "1" });
    if (existing.length) {
      const record = existing[0]!; const payload = isRecord(record.payload) ? record.payload : {};
      if (record.project_id !== projectId || payload.title !== title.trim() || payload.body !== detail.trim() || (payload.url ?? "") !== (url?.trim() ?? "")) throw new Error("Request identity is already bound to different project content");
      return id;
    }
    await this.#rpcPayload("command_center_canonical_create_entity", session.accessToken, {
      p_entity_id: id, p_entity_type: kind, p_project_id: projectId, p_schema_version: 1,
      p_payload: { title: title.trim(), body: detail.trim(), ...(url?.trim() ? { url: url.trim() } : {}), state: kind === "integration_request" ? "setup_requested" : "recorded", execution_authorized: false },
      p_source_ref: `owner:project-workspace:${id}`
    });
    return id;
  }

  async readCompanyBuildStart(projectId: string): Promise<CompanyBuildStartView> {
    // Scope is checked before any owner/project read. Never enter Company #014.
    if (!preparedCompanyId(projectId)) throw new Error("Company is outside this 116-company preparation scope");
    const session = await this.#assertProject(projectId);
    const [projects, roadmaps] = await Promise.all([
      this.#selectRows("command_center_project_profiles", session, "project_id,company_id,status", {
        project_id: `eq.${projectId}`, limit: "1"
      }),
      this.#selectRows("command_center_project_roadmaps", session, "project_id,version,state,structure_verified", {
        project_id: `eq.${projectId}`, state: "eq.current", limit: "1"
      })
    ]);
    if (projects.length !== 1 || roadmaps.length !== 1) throw new Error("Company preparation is not available");
    const version = roadmaps[0]?.version;
    if (typeof version !== "number" || !Number.isSafeInteger(version)) throw new Error("Roadmap version is not verified");
    const companyId = preparedCompanyId(projectId)!;
    const [checkpoints, packets, reconciliations] = await Promise.all([
      this.#selectRows("command_center_project_checkpoints", session,
        "checkpoint_id,roadmap_version,exact_next_work_unit_id,resume_state_hash", {
        project_id: `eq.${projectId}`, roadmap_version: `eq.${version}`,
        order: "created_at.desc", limit: "1"
      }),
      this.#selectRows("command_center_knowledge_claims", session,
        "claim_id,project_id,state,truth_state,value_jsonb,source_refs", {
        project_id: `eq.${projectId}`, claim_id: `eq.company-build-start:${companyId}:v1`, limit: "1"
      }),
      this.#selectRows("command_center_knowledge_claims", session,
        "claim_id,project_id,state,truth_state,value_jsonb,source_refs", {
        project_id: `eq.${projectId}`, claim_id: `eq.company-reconciliation:${companyId}:v1`, limit: "1"
      })
    ]);
    if (checkpoints.length !== 1 || packets.length !== 1 || reconciliations.length !== 1)
      throw new Error("The verified starting packet is missing from this project");
    return validateCompanyBuildStart(projectId, {
      project: projects[0], roadmap: roadmaps[0], checkpoint: checkpoints[0],
      start: packets[0], reconciliation: reconciliations[0]
    });
  }

  async createProjectAgencyRun(projectId: string, objective: string, requestId?: string): Promise<string> {
    if (!projectId.trim() || !objective.trim() || objective.length > 4000) throw new Error("A project and objective under 4,000 characters are required");
    const session = await this.#assertProject(projectId);
    const nonce = requestId ?? this.#randomId();
    if (!/^[a-f0-9-]{36}$/i.test(nonce)) throw new Error("Invalid request identity");
    const runId = `agency-run:${nonce}`;
    const receipt = await this.#rpcPayload("command_center_agency_start_normal_chat", session.accessToken, {
      p_project_id: projectId, p_run_id: runId, p_objective: objective.trim()
    });
    if (!isRecord(receipt) || receipt.run_id !== runId || !["queued", "working", "needs_user", "blocked", "paused", "completed"].includes(String(receipt.state))) throw new Error("Start did not confirm a durable normal-chat run");
    return runId;
  }

  async requestBrainResponse(conversationId: string, ownerTurnId: string): Promise<string> {
    if (!conversationId.trim() || !ownerTurnId.trim()) throw new Error("A saved conversation and owner turn are required");
    const session = this.#currentSession();
    const receipt = await invokeExecutionGateway({ supabaseUrl: this.#supabaseUrl, publishableKey: this.#publishableKey, accessToken: session.accessToken, fetcher: this.#fetcher }, {
      action: "brain_response", conversationId, ownerTurnId
    });
    if (typeof receipt.brainTurnId !== "string" || !receipt.brainTurnId.trim()) throw new Error("Brain did not confirm a saved response");
    return receipt.brainTurnId;
  }

  async stopProjectAgencyRun(projectId: string, runId: string, generation: number): Promise<void> {
    const session = await this.#assertProject(projectId);
    const rows = await this.#selectRows("command_center_agency_runs", session, "project_id,run_id", { project_id: `eq.${projectId}`, run_id: `eq.${runId}`, limit: "1" });
    if (!rows.some(row => row.run_id === runId && row.project_id === projectId)) throw new Error("Run is outside this project");
    await this.#rpcPayload("command_center_agency_transition_run", session.accessToken, { p_run_id: runId, p_expected_generation: generation, p_to_state: "stopped", p_blocker: null, p_verification_refs: [], p_evidence_refs: [`owner:stop-run:${this.#randomId()}`], p_occurred_at: new Date().toISOString() });
  }

  async continueProjectAgencyRun(projectId: string, runId: string, generation: number): Promise<void> {
    const session = await this.#assertProject(projectId);
    const rows = await this.#selectRows("command_center_agency_runs", session, "project_id,run_id,control_mode,authorization_ref,state", { project_id: `eq.${projectId}`, run_id: `eq.${runId}`, limit: "1" });
    const run = rows[0];
    if (!run || run.project_id !== projectId || run.control_mode !== "until_work" || run.authorization_ref !== `owner:normal-chat-start:${runId}` || !["needs_user", "blocked"].includes(String(run.state))) throw new Error("This run cannot be continued as normal-chat work");
    await this.#rpcPayload("command_center_agency_transition_run", session.accessToken, { p_run_id: runId, p_expected_generation: generation, p_to_state: "queued", p_blocker: null, p_verification_refs: [], p_evidence_refs: [`owner:normal-chat-continue:${this.#randomId()}`], p_occurred_at: new Date().toISOString() });
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
    const [conversationRows, turnRows, workspaceRows, improvementRows] = await Promise.all([
      this.#selectRows("command_center_brain_conversations", session, "conversation_id,project_id,title,state,created_at,updated_at", { order: "updated_at.desc", limit: "200" }),
      this.#selectRows("command_center_brain_conversation_turns", session, "turn_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,safe_text,content_ref,content_hash,evidence_refs,created_at,recorded_at", { order: "created_at.asc,turn_id.asc", limit: "2000" }),
      this.#selectRows("command_center_brain_project_workspaces", session, "project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at,recorded_at", { order: "updated_at.desc", limit: "500" }),
      this.#selectRows("command_center_brain_improvement_proposals", session, "improvement_id,project_id,area,title,detail_ref,detail_hash,confidence,evidence_refs,state,installs_automatically,created_at,decided_at", { order: "created_at.desc,improvement_id.asc", limit: "500" })
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
        ? Object.freeze(evidenceRefs.map((reference) => Object.freeze({ source: "supabase:command_center_brain_conversation_turns", observedAt: recordedAt as string, reference })))
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

    const improvements: RuntimeBrainImprovementProposal[] = improvementRows.map((row) => {
      const id = stringValue(row.improvement_id);
      const projectId = stringValue(row.project_id);
      const area = stringValue(row.area);
      const title = stringValue(row.title);
      const detailRef = stringValue(row.detail_ref);
      const detailHash = stringValue(row.detail_hash);
      const confidence = numberValue(row.confidence);
      const evidenceRefs = stringArray(row.evidence_refs);
      const state = stringValue(row.state);
      const createdAt = stringValue(row.created_at);
      const decidedAt = stringValue(row.decided_at);
      if (!id || !area || !IMPROVEMENT_AREAS.has(area) || !title || !detailRef || !detailHash || !/^[a-f0-9]{64}$/u.test(detailHash) || confidence === undefined || confidence < 0 || confidence > 1 || evidenceRefs.length === 0 || new Set(evidenceRefs).size !== evidenceRefs.length || !state || !IMPROVEMENT_STATES.has(state) || !createdAt) {
        throw new Error("Brain improvement proposal is malformed");
      }
      if (row.installs_automatically !== false) throw new Error("Brain improvement proposal cannot install automatically");
      if ((state === "proposed" && decidedAt) || (state !== "proposed" && !decidedAt)) throw new Error("Brain improvement decision state is inconsistent");
      return Object.freeze({
        id,
        ...(projectId ? { projectId } : {}),
        area: area as RuntimeBrainImprovementProposal["area"],
        title,
        detailRef,
        detailHash,
        confidence,
        evidenceRefs,
        state: state as RuntimeBrainImprovementProposal["state"],
        installsAutomatically: false as const,
        createdAt,
        ...(decidedAt ? { decidedAt } : {}),
        evidence: Object.freeze(evidenceRefs.map((reference) => Object.freeze({ source: "supabase:command_center_brain_improvement_proposals", observedAt: decidedAt ?? createdAt, reference })))
      });
    });

    return Object.freeze({
      availability: "available" as const,
      conversations: Object.freeze(conversations),
      workspaces: Object.freeze(workspaces),
      improvements: Object.freeze(improvements),
      evidence: Object.freeze([
        ...runtimeEvidence("supabase:command_center_brain_conversations"),
        ...runtimeEvidence("supabase:command_center_brain_project_workspaces"),
        ...runtimeEvidence("supabase:command_center_brain_improvement_proposals")
      ])
    });
  }

  #withBrainSnapshot(snapshot: CommandCenterRuntimeSnapshot, brain: RuntimeBrainSnapshot): CommandCenterRuntimeSnapshot {
    const brainSurface: RuntimeSurfaceSnapshot = brain.availability === "available"
      ? Object.freeze({
          key: "brain",
          label: "Brain",
          availability: "available" as const,
          summary: known(`${brain.conversations.length} persistent Brain conversation${brain.conversations.length === 1 ? "" : "s"} · ${brain.workspaces.length} project workspace${brain.workspaces.length === 1 ? "" : "s"} · ${brain.improvements.length} evidence-backed improvement proposal${brain.improvements.length === 1 ? "" : "s"}.`),
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
      const candidate = stringValue(payload.id) ?? stringValue(payload.conversation_id) ?? stringValue(payload.turn_id) ?? stringValue(payload.scope_request_id);
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
