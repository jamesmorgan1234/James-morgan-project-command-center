import { known, unknown, type TruthValue } from "../data/canonical.js";
import { buildRuntimeAgencySnapshot } from "./agency-runtime-projection.js";
import {
  createDisconnectedRuntimeSnapshot,
  type CommandCenterRuntimeSnapshot,
  type RuntimeAgencySnapshot,
  type RuntimeEvidenceRef,
  type RuntimeLiveExecution,
  type RuntimeNextWorkReadiness,
  type RuntimeProjectDetailSection,
  type RuntimeProjectSnapshot,
  type RuntimeSurfaceSnapshot
} from "./snapshot.js";
import type { RuntimeSnapshotProvider } from "./provider.js";

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type OwnerCredentialSubmit = (email: string, password: string) => Promise<void>;
export type OwnerCredentialPrompt = (submit: OwnerCredentialSubmit) => Promise<void>;
export type OwnerAuthenticatedCallback = (signOut: () => Promise<void>) => void;

export interface SupabaseOwnerRuntimeProviderOptions {
  readonly supabaseUrl: string;
  readonly publishableKey: string;
  readonly releaseId?: string;
  readonly fetcher?: typeof fetch;
  readonly storage?: SessionStorageLike;
  readonly promptForCredentials?: OwnerCredentialPrompt;
  readonly onAuthenticated?: OwnerAuthenticatedCallback;
  readonly requestTimeoutMs?: number;
}

interface StoredSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly userId: string;
}

type JsonRecord = Record<string, unknown>;

const SESSION_KEY = "command-center:owner-session:v1";
const NONTERMINAL_RUN_STATES = new Set(["queued", "working", "paused", "blocked", "needs_user"]);
const PROJECT_PRIORITY_RANK: Readonly<Record<string, number>> = Object.freeze({ critical: 0, high: 1, normal: 2, low: 3 });

function isRecord(value: unknown): value is JsonRecord { return typeof value === "object" && value !== null && !Array.isArray(value); }
function text(value: unknown): string | undefined { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function numeric(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}
function textArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.map(text).filter((item): item is string => !!item));
}
function truthText(value: unknown): TruthValue<string> { const parsed = text(value); return parsed ? known(parsed) : unknown<string>(); }
function defaultStorage(): SessionStorageLike {
  const values = new Map<string, string>();
  return {
    getItem(key: string): string | null { return values.get(key) ?? null; },
    setItem(key: string, value: string): void { values.set(key, String(value)); },
    removeItem(key: string): void { values.delete(key); }
  };
}
function evidence(source: string, observedAt: string, reference?: string): readonly RuntimeEvidenceRef[] {
  const ref = reference ? Object.freeze({ source, observedAt, reference }) : Object.freeze({ source, observedAt });
  return Object.freeze([ref]);
}

export class SupabaseOwnerRuntimeSnapshotProvider implements RuntimeSnapshotProvider {
  readonly id = "runtime:supabase-owner";
  readonly #supabaseUrl: string;
  readonly #publishableKey: string;
  readonly #releaseId: string | undefined;
  readonly #fetcher: typeof fetch;
  readonly #storage: SessionStorageLike | undefined;
  readonly #promptForCredentials: OwnerCredentialPrompt | undefined;
  readonly #onAuthenticated: OwnerAuthenticatedCallback | undefined;
  readonly #requestTimeoutMs: number;
  #sessionFlight: Promise<StoredSession | undefined> | undefined;

  constructor(options: SupabaseOwnerRuntimeProviderOptions) {
    this.#supabaseUrl = options.supabaseUrl.trim().replace(/\/$/, "");
    this.#publishableKey = options.publishableKey.trim();
    if (!/^https:\/\//.test(this.#supabaseUrl)) throw new Error("Supabase URL must use HTTPS");
    if (!this.#publishableKey.startsWith("sb_publishable_")) throw new Error("A Supabase publishable key is required");
    this.#releaseId = text(options.releaseId);
    this.#fetcher = options.fetcher ?? fetch;
    this.#storage = options.storage ?? defaultStorage();
    this.#promptForCredentials = options.promptForCredentials;
    this.#onAuthenticated = options.onAuthenticated;
    this.#requestTimeoutMs = options.requestTimeoutMs ?? 8000;
    if (!Number.isSafeInteger(this.#requestTimeoutMs) || this.#requestTimeoutMs < 1) throw new Error("Owner runtime request timeout must be a positive safe integer");
  }

  async signIn(email: string, password: string): Promise<void> {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) throw new Error("Email and password are required");
    const response = await this.#requestJson(`${this.#supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: this.#publishableKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Sign-in failed. Check the owner email and password.");
    const session = this.#sessionFromPayload(response.payload);
    if (!session) throw new Error("Supabase returned an invalid owner session");
    this.#saveSession(session);
    if (!await this.#isAuthorized(session)) {
      this.#clearSession();
      throw new Error("This signed-in account is not authorized for Command Center");
    }
  }

  async signOut(): Promise<void> {
    const session = this.#readSession();
    this.#clearSession();
    if (!session) return;
    try {
      await this.#fetcher(`${this.#supabaseUrl}/auth/v1/logout?scope=local`, {
        method: "POST",
        headers: { apikey: this.#publishableKey, authorization: `Bearer ${session.accessToken}` },
        cache: "no-store"
      });
    } catch {}
  }

  async load(): Promise<CommandCenterRuntimeSnapshot> {
    const observedAt = new Date().toISOString();
    let session: StoredSession | undefined;
    try {
      session = await this.#ensureSession(true);
    } catch {
      return this.#disconnected("Owner authentication could not be established. Check the network and sign in again.", observedAt);
    }
    if (!session) return this.#disconnected("Private owner sign-in is required before canonical runtime data can be loaded.", observedAt);

    try {
      if (!await this.#isAuthorized(session)) {
        this.#clearSession();
        return this.#disconnected("The signed-in account is not authorized for Command Center.", observedAt);
      }

      // Category 5 canonical project profiles are the required project truth source.
      // Absence of this migrated source fails closed instead of silently falling back to cc7_projects.
      const projects = await this.#queryRows(
        "command_center_project_profiles",
        "project_id,type_key,company_id,name,mission,lifecycle,status,verification,priority,version,updated_at",
        session,
        { order: "name.asc" }
      );

      const optionalErrors = new Set<string>();
      const safe = async (key: string, table: string, select: string, params: Readonly<Record<string, string>> = {}): Promise<readonly JsonRecord[]> => {
        try { return await this.#queryRows(table, select, session as StoredSession, params); }
        catch { optionalErrors.add(key); return Object.freeze([]); }
      };

      const [roadmaps, workUnits, gates, projectCheckpoints, detailSections, typeDetailSections, activity, agencyRuns, agencyJobs, agencyTasks, brainItems, automations, notifications, kpis, releases, bookReviews, publicationStates] = await Promise.all([
        safe("project-roadmaps", "command_center_project_roadmaps", "project_id,version,state,structure_verified,denominator_trusted,denominator_evidence_refs,source_ref,created_at", { state: "eq.current", order: "project_id.asc" }),
        safe("project-roadmaps", "command_center_project_work_units", "project_id,roadmap_version,work_unit_id,category_id,phase_id,title,status,applicable,dependency_ids,gate_ids,acceptance_criteria,evidence_refs,updated_at", { order: "project_id.asc,roadmap_version.desc,work_unit_id.asc" }),
        safe("project-roadmaps", "command_center_project_roadmap_gates", "project_id,roadmap_version,gate_id,satisfied,evidence_refs,updated_at", { order: "project_id.asc,roadmap_version.desc,gate_id.asc" }),
        safe("project-checkpoints", "command_center_project_checkpoints", "checkpoint_id,project_id,roadmap_version,exact_next_work_unit_id,blocker,required_environment,owner_action,verification_method,evidence_refs,resume_state_hash,created_at", { order: "created_at.desc", limit: "1200" }),
        safe("project-details", "command_center_project_detail_sections", "section_key,title,sort_order,capability_key,active,updated_at", { active: "eq.true", order: "sort_order.asc,section_key.asc" }),
        safe("project-details", "command_center_project_type_detail_sections", "type_key,section_key,required,source_ref,created_at", { order: "type_key.asc,section_key.asc" }),
        safe("activity", "cc7_activity", "project_id,headline,detail,happened_at", { order: "happened_at.desc", limit: "120" }),
        safe("agency", "command_center_agency_runs", "project_id,run_id,objective,control_mode,state,generation,authorization_ref,priority,stop_requested,pause_requested,blocker,checkpoint_id,evidence_refs,created_at,updated_at,completed_at", { order: "updated_at.desc", limit: "120" }),
        safe("agency", "command_center_agency_jobs", "project_id,run_id,job_id,objective,state,risk,cost_class,preferred_environment,capability,retry_count,blocker,checkpoint_ref,evidence_refs,created_at,updated_at", { order: "updated_at.desc", limit: "240" }),
        safe("agency", "command_center_agency_tasks", "project_id,run_id,job_id,task_id,title,state,dependency_ids,capability,risk,cost_class,preferred_environment,retry_count,idempotency_key,blocker,checkpoint_ref,evidence_refs,verification_refs,created_at,updated_at", { order: "updated_at.desc", limit: "600" }),
        safe("brain", "cc7_brain_items", "id,project_id,kind,title,status,importance,trust_state,source_ref,source_observed_at,updated_at", { order: "updated_at.desc", limit: "200" }),
        safe("automations", "cc7_automations", "id,project_id,kind,name,status,next_run_at,last_run_at,run_count,updated_at", { order: "updated_at.desc", limit: "200" }),
        safe("personal", "cc7_notifications", "id,project_id,title,severity,status,created_at,delivered_at,read_at", { order: "created_at.desc", limit: "100" }),
        safe("analytics", "cc7_analytics_kpis", "id,project_id,metric_key,label,value_numeric,value_text,unit,currency,verified,source_count,observed_at,updated_at", { order: "observed_at.desc", limit: "400" }),
        safe("release", "cc7_deployment_releases", "release_key,environment,provider,source_commit,status,known_good,deployed_at,verified_at,created_at", { order: "created_at.desc", limit: "100" }),
        safe("books", "book_owner_reviews", "id,project_id,status,updated_at", { order: "updated_at.desc", limit: "200" }),
        safe("books", "book_publication_states", "id,project_id,state,confirmed_at,updated_at", { order: "updated_at.desc", limit: "200" })
      ]);

      const agency = buildRuntimeAgencySnapshot({ runs: agencyRuns, jobs: agencyJobs, tasks: agencyTasks, observedAt, unavailable: optionalErrors.has("agency") });
      const projectSnapshots = this.#projectSnapshots(projects, roadmaps, workUnits, gates, projectCheckpoints, detailSections, typeDetailSections, activity, observedAt);
      const attentionCount = projectSnapshots.filter((project) => project.needsMeCount.state === "known" && project.needsMeCount.value > 0).length;
      const surfaceSnapshots = this.#surfaceSnapshots({
        observedAt,
        projectCount: projectSnapshots.length,
        attentionCount,
        agency,
        brainItems,
        automations,
        notifications,
        kpis,
        bookReviews,
        publicationStates,
        optionalErrors
      });
      const knownGood = releases.find((row) => row.known_good === true);
      const knownGoodId = knownGood ? text(knownGood.source_commit) ?? text(knownGood.release_key) : undefined;
      this.#onAuthenticated?.(() => this.signOut());
      return Object.freeze({
        schemaVersion: "cc-runtime-snapshot-v1" as const,
        generatedAt: observedAt,
        connection: Object.freeze({
          state: optionalErrors.size ? "degraded" as const : "connected" as const,
          providerId: this.id,
          message: optionalErrors.size ? `Canonical owner runtime connected with ${optionalErrors.size} optional source${optionalErrors.size === 1 ? "" : "s"} unavailable.` : "Authenticated canonical owner runtime connected.",
          lastSuccessfulSyncAt: known(observedAt)
        }),
        owner: Object.freeze({ displayName: unknown<string>() }),
        projects: Object.freeze(projectSnapshots),
        surfaces: Object.freeze(surfaceSnapshots),
        agency,
        release: Object.freeze({
          releaseId: this.#releaseId ? known(this.#releaseId) : unknown<string>(),
          knownGoodReleaseId: knownGoodId ? known(knownGoodId) : unknown<string>()
        })
      });
    } catch {
      return this.#disconnected("Canonical owner runtime could not be loaded. No private values were fabricated.", observedAt);
    }
  }

  async #ensureSession(interactive: boolean): Promise<StoredSession | undefined> {
    // Navigation/connectivity events may load concurrently while sign-in is pending.
    // Share only session establishment; clear both successful and rejected flights.
    if (this.#sessionFlight) return this.#sessionFlight;
    const flight = Promise.resolve().then(() => this.#establishSession(interactive));
    this.#sessionFlight = flight;
    try { return await flight; }
    finally { if (this.#sessionFlight === flight) this.#sessionFlight = undefined; }
  }

  async #establishSession(interactive: boolean): Promise<StoredSession | undefined> {
    let session = this.#readSession();
    if (session && session.expiresAt <= Math.floor(Date.now() / 1000) + 90) session = await this.#refreshSession(session);
    if (session || !interactive || !this.#promptForCredentials) return session;
    await this.#promptForCredentials(async (email, password) => this.signIn(email, password));
    session = this.#readSession();
    return session;
  }

  async #refreshSession(current: StoredSession): Promise<StoredSession | undefined> {
    try {
      const response = await this.#requestJson(`${this.#supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: this.#publishableKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ refresh_token: current.refreshToken }),
        cache: "no-store"
      });
      if (!response.ok) { this.#clearSession(); return undefined; }
      const refreshed = this.#sessionFromPayload(response.payload, current.userId);
      if (!refreshed) { this.#clearSession(); return undefined; }
      this.#saveSession(refreshed);
      return refreshed;
    } catch {
      return current.expiresAt > Math.floor(Date.now() / 1000) ? current : undefined;
    }
  }

  #sessionFromPayload(payload: unknown, fallbackUserId?: string): StoredSession | undefined {
    if (!isRecord(payload)) return undefined;
    const accessToken = text(payload.access_token);
    const refreshToken = text(payload.refresh_token);
    const expiresAtRaw = numeric(payload.expires_at);
    const expiresIn = numeric(payload.expires_in);
    const user = isRecord(payload.user) ? payload.user : undefined;
    const userId = text(user?.id) ?? fallbackUserId;
    const expiresAt = expiresAtRaw ?? (expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined);
    if (!accessToken || !refreshToken || !userId || !expiresAt) return undefined;
    return Object.freeze({ accessToken, refreshToken, userId, expiresAt });
  }

  #readSession(): StoredSession | undefined {
    const raw = this.#storage?.getItem(SESSION_KEY);
    if (!raw) return undefined;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed)) return undefined;
      const accessToken = text(parsed.accessToken);
      const refreshToken = text(parsed.refreshToken);
      const userId = text(parsed.userId);
      const expiresAt = numeric(parsed.expiresAt);
      // Zero is the broker's expired restore marker, not an absent timestamp.
      // It must reach refresh/authorization and must never authorize data itself.
      if (!accessToken || !refreshToken || !userId || expiresAt === undefined) return undefined;
      return Object.freeze({ accessToken, refreshToken, userId, expiresAt });
    } catch { return undefined; }
  }

  #saveSession(session: StoredSession): void { this.#storage?.setItem(SESSION_KEY, JSON.stringify(session)); }
  #clearSession(): void { this.#storage?.removeItem(SESSION_KEY); }

  async #isAuthorized(session: StoredSession): Promise<boolean> {
    const rows = await this.#queryRows("cc7_owner_access", "enabled", session, { enabled: "eq.true", limit: "1" });
    return rows.some((row) => row.enabled === true);
  }

  async #queryRows(table: string, select: string, session: StoredSession, params: Readonly<Record<string, string>> = {}): Promise<readonly JsonRecord[]> {
    const url = new URL(`${this.#supabaseUrl}/rest/v1/${table}`);
    url.searchParams.set("select", select);
    url.searchParams.set("owner_id", `eq.${session.userId}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await this.#requestJson(url, {
      method: "GET",
      headers: { apikey: this.#publishableKey, authorization: `Bearer ${session.accessToken}`, accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Canonical source ${table} is unavailable`);
    const payload: unknown = response.payload;
    if (!Array.isArray(payload)) throw new Error(`Canonical source ${table} returned an invalid payload`);
    return Object.freeze(payload.filter(isRecord));
  }

  async #requestJson(input: string | URL, init: RequestInit): Promise<Readonly<{ ok: boolean; payload: unknown }>> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        Promise.resolve().then(async () => {
          const response = await this.#fetcher(input, { ...init, signal: controller.signal });
          return { ok: response.ok, payload: response.ok ? await response.json() : undefined };
        }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Owner runtime request timed out"));
          }, this.#requestTimeoutMs);
        })
      ]);
    } finally { if (timer !== undefined) clearTimeout(timer); }
  }

  #projectSnapshots(
    projects: readonly JsonRecord[],
    roadmaps: readonly JsonRecord[],
    workUnits: readonly JsonRecord[],
    gates: readonly JsonRecord[],
    checkpoints: readonly JsonRecord[],
    detailSections: readonly JsonRecord[],
    typeDetailSections: readonly JsonRecord[],
    activity: readonly JsonRecord[],
    observedAt: string
  ): readonly RuntimeProjectSnapshot[] {
    return Object.freeze(projects.map((project) => {
      const id = text(project.project_id) as string;
      const name = text(project.name) as string;
      const typeKey = text(project.type_key);
      const roadmap = roadmaps.find((row) => row.project_id === id && text(row.state) === "current");
      const roadmapVersion = numeric(roadmap?.version);
      const projectUnits = roadmapVersion === undefined ? [] : workUnits.filter((row) => row.project_id === id && numeric(row.roadmap_version) === roadmapVersion);
      const projectGates = roadmapVersion === undefined ? [] : gates.filter((row) => row.project_id === id && numeric(row.roadmap_version) === roadmapVersion);
      const unitById = new Map(projectUnits.map((row) => [text(row.work_unit_id), row]));
      const gateById = new Map(projectGates.map((row) => [text(row.gate_id), row]));
      const roadmapStructureVerified = roadmap?.structure_verified === true;
      const readyUnits = roadmapStructureVerified ? projectUnits.filter((unit) => {
        if (unit.applicable !== true || !["planned", "ready"].includes(text(unit.status) ?? "")) return false;
        const dependencies = textArray(unit.dependency_ids);
        const gateIds = textArray(unit.gate_ids);
        const dependenciesMet = dependencies.every((dependency) => {
          const row = unitById.get(dependency);
          return row ? ["verified", "skipped"].includes(text(row.status) ?? "") : false;
        });
        const gatesMet = gateIds.every((gateId) => gateById.get(gateId)?.satisfied === true);
        return dependenciesMet && gatesMet;
      }) : [];
      readyUnits.sort((a, b) => (text(a.work_unit_id) ?? "").localeCompare(text(b.work_unit_id) ?? ""));
      const readyUnit = readyUnits[0];

      let progressPercent: TruthValue<number> = unknown<number>();
      if (roadmapStructureVerified && roadmap?.denominator_trusted === true) {
        const applicable = projectUnits.filter((row) => row.applicable === true);
        if (applicable.length > 0) {
          const completed = applicable.filter((row) => ["verified", "skipped"].includes(text(row.status) ?? "")).length;
          progressPercent = known(Math.round((completed / applicable.length) * 100));
        }
      }

      const checkpoint = checkpoints.find((row) => row.project_id === id && (roadmapVersion === undefined || numeric(row.roadmap_version) === roadmapVersion));
      const recent = activity.filter((item) => item.project_id === id).slice(0, 5).map((item) => text(item.headline)).filter((value): value is string => !!value);
      const blocker = text(checkpoint?.blocker);
      const ownerAction = text(checkpoint?.owner_action);
      const priority = text(project.priority);
      const priorityRank = PROJECT_PRIORITY_RANK[priority ?? ""] ?? 9;
      const readyId = text(readyUnit?.work_unit_id);
      const readyTitle = text(readyUnit?.title);
      const readyObservedAt = text(readyUnit?.updated_at) ?? observedAt;
      const nextWorkReadiness: TruthValue<RuntimeNextWorkReadiness> = readyId && readyTitle
        ? known(Object.freeze({
            workUnitId: readyId,
            ready: true as const,
            title: readyTitle,
            priorityRank,
            evidence: evidence("supabase:command_center_project_work_units", readyObservedAt, `${id}:${roadmapVersion ?? "na"}:${readyId}`)
          }))
        : unknown<RuntimeNextWorkReadiness>();

      const boundSections: readonly RuntimeProjectDetailSection[] = typeKey
        ? Object.freeze(typeDetailSections
            .filter((binding) => text(binding.type_key) === typeKey)
            .map((binding) => {
              const sectionKey = text(binding.section_key);
              const definition = sectionKey ? detailSections.find((candidate) => text(candidate.section_key) === sectionKey && candidate.active === true) : undefined;
              if (!sectionKey || !definition) return undefined;
              const title = text(definition.title);
              const sortOrder = numeric(definition.sort_order);
              if (!title || sortOrder === undefined) return undefined;
              const capabilityKey = text(definition.capability_key);
              const observed = text(definition.updated_at) ?? text(binding.created_at) ?? observedAt;
              return Object.freeze({
                key: sectionKey,
                title,
                sortOrder,
                required: binding.required === true,
                ...(capabilityKey ? { capabilityKey } : {}),
                content: unknown<string>(),
                evidence: evidence("supabase:command_center_project_detail_sections", observed, `${typeKey}:${sectionKey}`)
              }) as RuntimeProjectDetailSection;
            })
            .filter((section): section is RuntimeProjectDetailSection => !!section)
            .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key)))
        : Object.freeze([]);

      const updatedAt = text(project.updated_at) ?? observedAt;
      return Object.freeze({
        id,
        name,
        mission: truthText(project.mission),
        lifecycle: truthText(project.lifecycle),
        verification: truthText(project.verification),
        priority: truthText(project.priority),
        stage: truthText(readyUnit?.phase_id),
        status: truthText(project.status),
        progressPercent,
        currentCheckpoint: checkpoint ? truthText(checkpoint.checkpoint_id) : unknown<string>(),
        nextAction: readyTitle ? known(readyTitle) : unknown<string>(),
        blockers: blocker ? known(Object.freeze([blocker])) : known(Object.freeze([]) as readonly string[]),
        needsMeCount: known(ownerAction ? 1 : 0),
        agencyState: unknown<string>(),
        recentActivity: known(Object.freeze(recent) as readonly string[]),
        evidence: evidence("supabase:command_center_project_profiles", updatedAt, id),
        liveExecution: unknown<RuntimeLiveExecution>(),
        nextWorkReadiness,
        typeKey: truthText(project.type_key),
        companyId: truthText(project.company_id),
        detailSections: boundSections
      });
    }));
  }

  #surfaceSnapshots(input: Readonly<{
    observedAt: string;
    projectCount: number;
    attentionCount: number;
    agency: RuntimeAgencySnapshot;
    brainItems: readonly JsonRecord[];
    automations: readonly JsonRecord[];
    notifications: readonly JsonRecord[];
    kpis: readonly JsonRecord[];
    bookReviews: readonly JsonRecord[];
    publicationStates: readonly JsonRecord[];
    optionalErrors: ReadonlySet<string>;
  }>): readonly RuntimeSurfaceSnapshot[] {
    const available = (key: string, label: string, summary: string, source: string): RuntimeSurfaceSnapshot => Object.freeze({ key, label, availability: "available" as const, summary: known(summary), evidence: evidence(source, input.observedAt) });
    const unavailable = (key: string, label: string): RuntimeSurfaceSnapshot => Object.freeze({ key, label, availability: "unavailable" as const, summary: unknown<string>(), evidence: Object.freeze([]) as readonly RuntimeEvidenceRef[] });
    const safeSurface = (sourceKey: string, key: string, label: string, summary: string, source: string): RuntimeSurfaceSnapshot => input.optionalErrors.has(sourceKey) ? unavailable(key, label) : available(key, label, summary, source);
    const nonterminalRuns = input.agency.runs.filter((run) => NONTERMINAL_RUN_STATES.has(run.state.toLowerCase()));
    const workingTasks = input.agency.tasks.filter((task) => task.state.toLowerCase() === "working").length;
    const attentionTasks = input.agency.tasks.filter((task) => ["blocked", "needs_user", "work_boundary"].includes(task.state.toLowerCase())).length;
    const activeAutomations = input.automations.filter((item) => ["active", "enabled", "scheduled", "watching"].includes(text(item.status)?.toLowerCase() ?? "")).length;
    const unreadNotifications = input.notifications.filter((item) => !item.read_at && text(item.status)?.toLowerCase() !== "dismissed").length;
    const verifiedKpis = input.kpis.filter((item) => item.verified === true).length;
    const bookRecordCount = input.bookReviews.length + input.publicationStates.length;
    return Object.freeze([
      available("home", "Home", "Canonical Command Center runtime connected.", "supabase:owner-runtime"),
      available("projects", "Projects", `${input.projectCount} canonical project profile${input.projectCount === 1 ? "" : "s"} loaded.`, "supabase:command_center_project_profiles"),
      safeSurface("brain", "brain", "Brain", `${input.brainItems.length} canonical Brain item${input.brainItems.length === 1 ? "" : "s"} loaded.`, "supabase:cc7_brain_items"),
      input.agency.availability === "available"
        ? available("agency", "Agency", `${nonterminalRuns.length} nonterminal durable run${nonterminalRuns.length === 1 ? "" : "s"} · ${workingTasks} working task${workingTasks === 1 ? "" : "s"} · ${attentionTasks} task${attentionTasks === 1 ? "" : "s"} requiring blocker/user/work-boundary handling.`, "supabase:command_center_agency_runs+jobs+tasks")
        : unavailable("agency", "Agency"),
      available("needs-me", "Needs Me", `${input.attentionCount} project${input.attentionCount === 1 ? "" : "s"} with an explicit owner action in the latest durable checkpoint.`, "supabase:command_center_project_checkpoints.owner_action"),
      available("search", "Search", `${input.projectCount} canonical project profile${input.projectCount === 1 ? "" : "s"} available to search.`, "supabase:command_center_project_profiles"),
      safeSurface("automations", "automations", "Automations", `${activeAutomations} active automation${activeAutomations === 1 ? "" : "s"} of ${input.automations.length} loaded.`, "supabase:cc7_automations"),
      safeSurface("personal", "personal", "Personal", `${unreadNotifications} unread owner notification${unreadNotifications === 1 ? "" : "s"} of ${input.notifications.length} loaded.`, "supabase:cc7_notifications"),
      unavailable("finance", "Finance"),
      unavailable("social", "Social & Communications"),
      safeSurface("books", "books", "Books", `${bookRecordCount} owner-review/publication state record${bookRecordCount === 1 ? "" : "s"} loaded.`, "supabase:book_owner_reviews+book_publication_states"),
      unavailable("specialists", "Specialists"),
      safeSurface("analytics", "analytics", "Analytics", `${verifiedKpis} verified KPI record${verifiedKpis === 1 ? "" : "s"} of ${input.kpis.length} loaded.`, "supabase:cc7_analytics_kpis"),
      available("settings", "Settings", "Owner session authenticated and canonical runtime connected.", "supabase:cc7_owner_access")
    ]);
  }

  #disconnected(message: string, observedAt: string): CommandCenterRuntimeSnapshot {
    const base = createDisconnectedRuntimeSnapshot(this.id, observedAt);
    return Object.freeze({ ...base, connection: Object.freeze({ ...base.connection, message }) });
  }
}
