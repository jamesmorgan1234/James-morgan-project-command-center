import { known, unknown, type TruthValue } from "../data/canonical.js";
import { createDisconnectedRuntimeSnapshot, type CommandCenterRuntimeSnapshot, type RuntimeEvidenceRef, type RuntimeProjectSnapshot, type RuntimeSurfaceSnapshot } from "./snapshot.js";
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
}

interface StoredSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly userId: string;
}

type JsonRecord = Record<string, unknown>;

const SESSION_KEY = "command-center:owner-session:v1";
const EXCLUDED_PROJECT_NAMES = new Set(["Operating Order", "Crestven Holdings", "Crest Van Holdings", "Outreach", "Crowdskein", "Loopwren"]);
const ACTIVE_RUN_STATES = new Set(["queued", "working", "paused", "blocked", "needs_user", "needs_owner", "work_boundary"]);

function isRecord(value: unknown): value is JsonRecord { return typeof value === "object" && value !== null && !Array.isArray(value); }
function text(value: unknown): string | undefined { return typeof value === "string" && value.trim() ? value.trim() : undefined; }
function bool(value: unknown): boolean | undefined { return typeof value === "boolean" ? value : undefined; }
function numeric(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}
function truthText(value: unknown): TruthValue<string> { const parsed = text(value); return parsed ? known(parsed) : unknown<string>(); }
function defaultStorage(): SessionStorageLike | undefined {
  try { return typeof localStorage === "undefined" ? undefined : localStorage; } catch { return undefined; }
}
function evidence(source: string, observedAt: string, reference?: string): readonly RuntimeEvidenceRef[] {
  const ref = reference ? Object.freeze({ source, observedAt, reference }) : Object.freeze({ source, observedAt });
  return Object.freeze([ref]);
}
function normalizeLifecycle(value: unknown): string {
  const raw = text(value)?.toLowerCase() ?? "unknown";
  if (raw.includes("live")) return "live";
  if (raw.includes("active")) return "active";
  if (raw.includes("pause")) return "paused";
  if (raw.includes("block") || raw.includes("needs")) return "blocked";
  if (raw.includes("archive") || raw.includes("closed")) return "archived";
  if (raw.includes("candidate")) return "candidate";
  if (raw.includes("plan")) return "planning";
  return raw.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
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
  }

  async signIn(email: string, password: string): Promise<void> {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) throw new Error("Email and password are required");
    const response = await this.#fetcher(`${this.#supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: this.#publishableKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Sign-in failed. Check the owner email and password.");
    const session = this.#sessionFromPayload(await response.json());
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

      const projects = await this.#queryRows("cc7_projects", "id,name,category,status,verification,stage,next_action,blocker,attention,sort_order,last_verified,source_status,updated_at", session, { order: "sort_order.asc,name.asc" });
      const optionalErrors = new Set<string>();
      const safe = async (key: string, table: string, select: string, params: Readonly<Record<string, string>> = {}): Promise<readonly JsonRecord[]> => {
        try { return await this.#queryRows(table, select, session as StoredSession, params); }
        catch { optionalErrors.add(key); return Object.freeze([]); }
      };
      const [metrics, activity, controls, runs, brainItems, automations, notifications, kpis, releases, checkpoints, bookReviews, publicationStates] = await Promise.all([
        safe("metrics", "cc7_metrics", "project_id,key,value_numeric,value_text,unit,verified,source,updated_at", { order: "updated_at.desc" }),
        safe("activity", "cc7_activity", "project_id,headline,detail,happened_at", { order: "happened_at.desc", limit: "120" }),
        safe("agency", "cc7_agent_controls", "auto_enabled,current_run_id,runner_state,updated_at,project_auto_enabled,project_auto_project_id", { limit: "1" }),
        safe("agency", "cc7_agent_runs", "id,project_id,objective,status,exact_next_action,created_at,started_at,completed_at,updated_at", { order: "created_at.desc", limit: "60" }),
        safe("brain", "cc7_brain_items", "id,project_id,kind,title,status,importance,trust_state,source_ref,source_observed_at,updated_at", { order: "updated_at.desc", limit: "200" }),
        safe("automations", "cc7_automations", "id,project_id,kind,name,status,next_run_at,last_run_at,run_count,updated_at", { order: "updated_at.desc", limit: "200" }),
        safe("personal", "cc7_notifications", "id,project_id,title,severity,status,created_at,delivered_at,read_at", { order: "created_at.desc", limit: "100" }),
        safe("analytics", "cc7_analytics_kpis", "id,project_id,metric_key,label,value_numeric,value_text,unit,currency,verified,source_count,observed_at,updated_at", { order: "observed_at.desc", limit: "400" }),
        safe("release", "cc7_deployment_releases", "release_key,environment,provider,source_commit,status,known_good,deployed_at,verified_at,created_at", { order: "created_at.desc", limit: "100" }),
        safe("checkpoints", "source_checkpoints", "id,project_id,observed_at,summary,verified,created_at", { verified: "eq.true", order: "observed_at.desc", limit: "1200" }),
        safe("books", "book_owner_reviews", "id,project_id,status,updated_at", { order: "updated_at.desc", limit: "200" }),
        safe("books", "book_publication_states", "id,project_id,status,confirmed_at,updated_at", { order: "updated_at.desc", limit: "200" })
      ]);

      const filteredProjects = projects.filter((row) => {
        const name = text(row.name);
        return !!name && !EXCLUDED_PROJECT_NAMES.has(name) && !String(row.source_status ?? "").startsWith("filing_only_hidden");
      });
      const projectSnapshots = this.#projectSnapshots(filteredProjects, metrics, activity, runs, controls, checkpoints, observedAt);
      const attentionCount = filteredProjects.filter((row) => row.attention === true).length;
      const surfaceSnapshots = this.#surfaceSnapshots({
        observedAt,
        projectCount: projectSnapshots.length,
        attentionCount,
        controls,
        runs,
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
    let session = this.#readSession();
    if (session && session.expiresAt <= Math.floor(Date.now() / 1000) + 90) session = await this.#refreshSession(session);
    if (session || !interactive || !this.#promptForCredentials) return session;
    await this.#promptForCredentials(async (email, password) => this.signIn(email, password));
    session = this.#readSession();
    return session;
  }

  async #refreshSession(current: StoredSession): Promise<StoredSession | undefined> {
    try {
      const response = await this.#fetcher(`${this.#supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: this.#publishableKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ refresh_token: current.refreshToken }),
        cache: "no-store"
      });
      if (!response.ok) { this.#clearSession(); return undefined; }
      const refreshed = this.#sessionFromPayload(await response.json(), current.userId);
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
      if (!accessToken || !refreshToken || !userId || !expiresAt) return undefined;
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
    const response = await this.#fetcher(url, {
      method: "GET",
      headers: { apikey: this.#publishableKey, authorization: `Bearer ${session.accessToken}`, accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Canonical source ${table} is unavailable`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error(`Canonical source ${table} returned an invalid payload`);
    return Object.freeze(payload.filter(isRecord));
  }

  #projectSnapshots(projects: readonly JsonRecord[], metrics: readonly JsonRecord[], activity: readonly JsonRecord[], runs: readonly JsonRecord[], controls: readonly JsonRecord[], checkpoints: readonly JsonRecord[], observedAt: string): readonly RuntimeProjectSnapshot[] {
    const control = controls[0];
    return Object.freeze(projects.map((project) => {
      const id = text(project.id) as string;
      const name = text(project.name) as string;
      const progressMetric = metrics.find((metric) => metric.project_id === id && metric.key === "current_scope_progress_percent" && metric.verified === true);
      const progress = numeric(progressMetric?.value_numeric);
      const recent = activity.filter((item) => item.project_id === id).slice(0, 5).map((item) => text(item.headline)).filter((value): value is string => !!value);
      const projectRuns = runs.filter((run) => run.project_id === id);
      const activeRun = projectRuns.find((run) => ACTIVE_RUN_STATES.has(text(run.status)?.toLowerCase() ?? ""));
      const checkpoint = checkpoints.find((item) => item.project_id === id);
      const blocker = text(project.blocker);
      const projectAuto = control?.project_auto_enabled === true && control.project_auto_project_id === id;
      const agencyState = text(activeRun?.status) ?? (projectAuto ? "project auto enabled" : undefined);
      const updatedAt = text(project.updated_at) ?? observedAt;
      return Object.freeze({
        id,
        name,
        mission: unknown<string>(),
        lifecycle: known(normalizeLifecycle(project.status)),
        verification: truthText(project.verification),
        priority: unknown<string>(),
        stage: truthText(project.stage),
        status: truthText(project.status),
        progressPercent: progress !== undefined && progress >= 0 && progress <= 100 ? known(progress) : unknown<number>(),
        currentCheckpoint: checkpoint ? truthText(checkpoint.id) : unknown<string>(),
        nextAction: truthText(project.next_action),
        blockers: blocker ? known(Object.freeze([blocker])) : known(Object.freeze([]) as readonly string[]),
        needsMeCount: known(project.attention === true ? 1 : 0),
        agencyState: agencyState ? known(agencyState) : unknown<string>(),
        recentActivity: known(Object.freeze(recent) as readonly string[]),
        evidence: evidence("supabase:cc7_projects", updatedAt, id)
      });
    }));
  }

  #surfaceSnapshots(input: Readonly<{
    observedAt: string;
    projectCount: number;
    attentionCount: number;
    controls: readonly JsonRecord[];
    runs: readonly JsonRecord[];
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
    const control = input.controls[0];
    const activeRuns = input.runs.filter((run) => ACTIVE_RUN_STATES.has(text(run.status)?.toLowerCase() ?? ""));
    const runner = text(control?.runner_state) ?? "state unavailable";
    const activeAutomations = input.automations.filter((item) => ["active", "enabled", "scheduled", "watching"].includes(text(item.status)?.toLowerCase() ?? "")).length;
    const unreadNotifications = input.notifications.filter((item) => !item.read_at && text(item.status)?.toLowerCase() !== "dismissed").length;
    const verifiedKpis = input.kpis.filter((item) => item.verified === true).length;
    const bookRecordCount = input.bookReviews.length + input.publicationStates.length;
    return Object.freeze([
      available("home", "Home", "Canonical Command Center runtime connected.", "supabase:owner-runtime"),
      available("projects", "Projects", `${input.projectCount} canonical project record${input.projectCount === 1 ? "" : "s"} loaded.`, "supabase:cc7_projects"),
      safeSurface("brain", "brain", "Brain", `${input.brainItems.length} canonical Brain item${input.brainItems.length === 1 ? "" : "s"} loaded.`, "supabase:cc7_brain_items"),
      safeSurface("agency", "agency", "Agency", `Runner ${runner} · ${activeRuns.length} active run${activeRuns.length === 1 ? "" : "s"}.`, "supabase:cc7_agent_controls"),
      available("needs-me", "Needs Me", `${input.attentionCount} project${input.attentionCount === 1 ? "" : "s"} currently marked for owner attention.`, "supabase:cc7_projects.attention"),
      available("search", "Search", `${input.projectCount} canonical project record${input.projectCount === 1 ? "" : "s"} available to search.`, "supabase:cc7_projects"),
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
