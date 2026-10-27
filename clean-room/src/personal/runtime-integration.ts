import { assertCalendarChangeIntent, assertCalendarEvent, reconcileCalendarEvent, type CalendarChangeIntent, type CalendarEventRecord, type CalendarReconciliationResult } from "./calendar.js";
import { projectPersonalOperations, validatePersonalOperations, type PersonalOperationKind, type PersonalOperationRecord, type PersonalOperationProjection } from "./operations.js";
import { recommendFollowUps, type ContactRecord, type FollowUpRecord, type FollowUpRecommendation } from "./contacts.js";
import { type NeedResolution, type OwnerNeed } from "./needs-me.js";
import { knownSetupBlockers, validateOnboardingManifest, type OnboardingManifest, type SetupRequirement } from "./onboarding.js";
import { federatedSearch, type SearchDocument, type SearchHit, type SearchRequest } from "./search.js";
import { acknowledgeNotification, routeNotifications, type NotificationAcknowledgement, type NotificationChannelPolicy, type NotificationIntent, type RoutedNotification } from "./notifications.js";
import { AutomationRegistry, planAutomationCatchUp, type AutomationAuthoritySnapshot, type ScheduledAutomation } from "./automations.js";
import { evaluateWatch, type ConditionWatch, type WatchDecision, type WatchObservation } from "./watches.js";
import { applyPersonalRecovery, planPersonalRecovery, type PersonalBackupRecord, type PersonalRecoveryApplication, type PersonalRecoveryContext, type PersonalRecoverySnapshot } from "./recovery.js";
import { TaskLedger, taskOccurrenceIdempotencyKey, type TaskOccurrence, type TaskPersistenceSnapshot } from "./tasks.js";

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function validTime(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp`);
  return parsed;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  const normalized = values.map((value) => value.trim());
  if ((requireOne && normalized.length === 0) || normalized.some((value) => !value) || new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze(normalized);
}

// P8.1 — application persistence seam and deterministic Agency handoff.
export interface TaskSnapshotEnvelope {
  readonly revision: string;
  readonly snapshot: TaskPersistenceSnapshot;
}

export interface TaskSnapshotStore {
  load(ownerId: string): Promise<TaskSnapshotEnvelope | undefined>;
  save(ownerId: string, expectedRevision: string | undefined, snapshot: TaskPersistenceSnapshot): Promise<string>;
}

export interface TaskOccurrenceAgencyReservation {
  readonly agencyExecutionRef: string;
  readonly evidenceRefs: readonly string[];
}

export interface TaskOccurrenceAgencyBridge {
  reserve(input: Readonly<{
    ownerId: string;
    taskId: string;
    projectId?: string;
    occurrenceKey: string;
    scheduledFor: string;
    idempotencyKey: string;
    pifTraceRef?: string;
  }>): Promise<TaskOccurrenceAgencyReservation>;
}

function assertTaskOwnerSnapshot(ownerId: string, snapshot: TaskPersistenceSnapshot): void {
  const owner = required(ownerId, "Task store owner");
  if (snapshot.tasks.some((task) => task.ownerId !== owner) || snapshot.occurrences.some((occurrence) => occurrence.ownerId !== owner) || snapshot.completions.some((completion) => completion.ownerId !== owner)) throw new Error("Task persistence snapshot crosses owner boundary");
}

export async function loadTaskLedger(ownerId: string, store: TaskSnapshotStore): Promise<Readonly<{ ledger: TaskLedger; revision?: string }>> {
  const owner = required(ownerId, "Task store owner");
  const envelope = await store.load(owner);
  if (!envelope) return Object.freeze({ ledger: new TaskLedger() });
  required(envelope.revision, "Task snapshot revision");
  assertTaskOwnerSnapshot(owner, envelope.snapshot);
  return Object.freeze({ ledger: TaskLedger.rehydrate(envelope.snapshot), revision: envelope.revision });
}

export async function saveTaskLedger(ownerId: string, ledger: TaskLedger, store: TaskSnapshotStore, expectedRevision?: string): Promise<string> {
  const owner = required(ownerId, "Task store owner");
  const snapshot = ledger.exportSnapshot();
  assertTaskOwnerSnapshot(owner, snapshot);
  return required(await store.save(owner, expectedRevision, snapshot), "Task snapshot revision");
}

export async function reserveTaskOccurrenceForAgency(ledger: TaskLedger, input: Readonly<{ taskId: string; occurrenceKey: string; scheduledFor: string; evidenceRefs: readonly string[]; pifTraceRef?: string }>, agency: TaskOccurrenceAgencyBridge): Promise<TaskOccurrence> {
  const task = ledger.get(required(input.taskId, "Task id"));
  if (!task) throw new Error(`Unknown task: ${input.taskId}`);
  const occurrenceKey = required(input.occurrenceKey, "Task occurrence key");
  validTime(input.scheduledFor, "Task scheduledFor");
  const idempotencyKey = taskOccurrenceIdempotencyKey(task.ownerId, task.id, occurrenceKey);
  const reservation = await agency.reserve(Object.freeze({ ownerId: task.ownerId, taskId: task.id, ...(task.projectId !== undefined ? { projectId: task.projectId } : {}), occurrenceKey, scheduledFor: input.scheduledFor, idempotencyKey, ...(input.pifTraceRef !== undefined ? { pifTraceRef: required(input.pifTraceRef, "PIF trace reference") } : {}) }));
  const agencyExecutionRef = required(reservation.agencyExecutionRef, "Agency execution reference");
  const evidenceRefs = Object.freeze([...new Set([...refs(input.evidenceRefs, "Task occurrence evidence"), ...refs(reservation.evidenceRefs, "Agency reservation evidence")])]);
  return ledger.reserveOccurrence({ taskId: task.id, occurrenceKey, scheduledFor: input.scheduledFor, evidenceRefs, idempotencyKey, agencyExecutionRef, ...(input.pifTraceRef !== undefined ? { pifTraceRef: input.pifTraceRef.trim() } : {}) });
}

// P8.2 — replaceable provider transport, availability, owner-controlled changes and read-after-write verification.
export type CalendarRuntimeCapability = "read" | "create" | "update" | "delete" | "availability";

export interface CalendarBusyWindow {
  readonly startsAt: string;
  readonly endsAt: string;
  readonly sourceRef: string;
}

export interface CalendarProviderMutationReceipt {
  readonly sourceRef: string;
  readonly externalId: string;
  readonly providerVersion: number;
}

export interface CalendarProviderRuntimeAdapter {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly health: "available" | "degraded" | "unavailable";
  readonly capabilities: readonly CalendarRuntimeCapability[];
  readEvent(ownerId: string, externalId: string): Promise<CalendarEventRecord | undefined>;
  listAvailability(ownerId: string, startsAt: string, endsAt: string): Promise<readonly CalendarBusyWindow[]>;
  applyChange(ownerId: string, intent: CalendarChangeIntent, event?: CalendarEventRecord): Promise<CalendarProviderMutationReceipt>;
}

export interface CalendarChangeVerification {
  readonly providerKey: string;
  readonly externalId: string;
  readonly verified: boolean;
  readonly status: CalendarReconciliationResult["status"] | "deleted" | "missing_remote";
  readonly evidenceRefs: readonly string[];
}

export class CalendarRuntimeRegistry {
  readonly #providers = new Map<string, CalendarProviderRuntimeAdapter>();

  register(provider: CalendarProviderRuntimeAdapter): void {
    if (!provider.key.startsWith("calendar:") || !Number.isSafeInteger(provider.version) || provider.version < 1) throw new Error("Calendar runtime provider key/version are invalid");
    if (this.#providers.has(provider.key)) throw new Error(`Calendar runtime provider already exists: ${provider.key}`);
    this.#providers.set(provider.key, Object.freeze({ ...provider, capabilities: Object.freeze([...new Set(provider.capabilities)]) }));
  }

  provider(key: string, capability: CalendarRuntimeCapability): CalendarProviderRuntimeAdapter {
    const provider = this.#providers.get(key);
    if (!provider || !provider.enabled || provider.health === "unavailable" || !provider.capabilities.includes(capability)) throw new Error(`Calendar provider unavailable for ${capability}: ${key}`);
    return provider;
  }

  async availability(providerKey: string, ownerId: string, startsAt: string, endsAt: string): Promise<readonly CalendarBusyWindow[]> {
    const start = validTime(startsAt, "Calendar availability start"), end = validTime(endsAt, "Calendar availability end");
    if (end <= start) throw new Error("Calendar availability end must follow start");
    const provider = this.provider(providerKey, "availability");
    const windows = await provider.listAvailability(required(ownerId, "Calendar owner"), startsAt, endsAt);
    return Object.freeze(windows.map((window) => {
      const busyStart = validTime(window.startsAt, "Calendar busy start"), busyEnd = validTime(window.endsAt, "Calendar busy end");
      if (busyEnd <= busyStart || busyStart < start || busyEnd > end) throw new Error("Calendar provider returned invalid/out-of-window availability");
      return Object.freeze({ startsAt: window.startsAt, endsAt: window.endsAt, sourceRef: required(window.sourceRef, "Calendar availability source") });
    }));
  }

  async verifyExternalChange(local: CalendarEventRecord): Promise<CalendarChangeVerification> {
    assertCalendarEvent(local);
    const provider = this.provider(local.providerKey, "read");
    const remote = await provider.readEvent(local.ownerId, local.externalId);
    if (!remote) return Object.freeze({ providerKey: local.providerKey, externalId: local.externalId, verified: false, status: "missing_remote", evidenceRefs: Object.freeze([local.sourceRef]) });
    const result = reconcileCalendarEvent(local, remote);
    return Object.freeze({ providerKey: local.providerKey, externalId: local.externalId, verified: result.status === "unchanged" || result.status === "remote_applied", status: result.status, evidenceRefs: result.evidenceRefs });
  }

  async applyOwnerChange(providerKey: string, ownerId: string, intent: CalendarChangeIntent, event: CalendarEventRecord): Promise<CalendarChangeVerification> {
    assertCalendarChangeIntent(intent);
    const owner = required(ownerId, "Calendar owner");
    const capability = intent.action as "create" | "update" | "delete";
    const provider = this.provider(providerKey, capability);
    this.provider(providerKey, "read");
    assertCalendarEvent(event);
    if (event.ownerId !== owner || event.providerKey !== providerKey || event.id !== intent.eventId) throw new Error("Calendar change crosses owner/provider/event boundary");
    const externalId = event.externalId;
    const mutation = await provider.applyChange(owner, intent, event);
    if (required(mutation.externalId, "Calendar mutation external id") !== externalId || !Number.isSafeInteger(mutation.providerVersion) || mutation.providerVersion < 1) throw new Error("Calendar provider returned invalid mutation receipt");
    const remote = await provider.readEvent(owner, externalId);
    if (intent.action === "delete") return Object.freeze({ providerKey, externalId, verified: remote === undefined, status: remote === undefined ? "deleted" : "conflict", evidenceRefs: Object.freeze([required(mutation.sourceRef, "Calendar mutation source")]) });
    if (!remote) return Object.freeze({ providerKey, externalId, verified: false, status: "missing_remote", evidenceRefs: Object.freeze([required(mutation.sourceRef, "Calendar mutation source")]) });
    const result = reconcileCalendarEvent(event, remote);
    return Object.freeze({ providerKey, externalId, verified: result.status === "unchanged" || result.status === "remote_applied", status: result.status, evidenceRefs: Object.freeze([...new Set([mutation.sourceRef, ...result.evidenceRefs])]) });
  }
}

export interface CalendarReminderSchedule {
  readonly ownerId: string;
  readonly eventId: string;
  readonly scheduledFor: string;
  readonly dedupeKey: string;
  readonly sourceRef: string;
}

export function planCalendarReminder(event: CalendarEventRecord, scheduledFor: string): CalendarReminderSchedule {
  assertCalendarEvent(event);
  const reminderAt = validTime(scheduledFor, "Calendar reminder time");
  if (reminderAt >= validTime(event.startsAt, "Calendar event start")) throw new Error("Calendar reminder must occur before event start");
  return Object.freeze({ ownerId: event.ownerId, eventId: event.id, scheduledFor, dedupeKey: `calendar-reminder:${event.id}:${scheduledFor}`, sourceRef: event.sourceRef });
}

// P8.3 — specialist ownership routes through declared capabilities; projections stay read-only.
export interface PersonalOperationSpecialistCapability {
  readonly capabilityKey: string;
  readonly truthOwnerKey: string;
  readonly specialistProjectId?: string;
  readonly kinds: readonly PersonalOperationKind[];
  readonly enabled: boolean;
  readonly health: "available" | "degraded" | "unavailable";
}

export interface PersonalOperationRoute {
  readonly operationId: string;
  readonly canonicalRef: string;
  readonly route: "personal-core" | "specialist";
  readonly capabilityKey?: string;
  readonly readOnlyProjection: boolean;
}

export class PersonalOperationCapabilityRegistry {
  readonly #capabilities = new Map<string, PersonalOperationSpecialistCapability>();
  register(capability: PersonalOperationSpecialistCapability): void {
    const key = required(capability.capabilityKey, "Personal specialist capability key"), owner = required(capability.truthOwnerKey, "Personal specialist truth owner");
    if (owner === "personal-core") throw new Error("Personal-core does not register as an external specialist");
    if (capability.specialistProjectId !== undefined) required(capability.specialistProjectId, "Specialist project id");
    if (capability.kinds.length === 0) throw new Error("Personal specialist capability requires at least one operation kind");
    if (this.#capabilities.has(key)) throw new Error(`Personal specialist capability already exists: ${key}`);
    this.#capabilities.set(key, Object.freeze({ ...capability, kinds: Object.freeze([...new Set(capability.kinds)]) }));
  }
  route(record: PersonalOperationRecord): PersonalOperationRoute {
    validatePersonalOperations([record]);
    if (record.truthOwnerKey === "personal-core") return Object.freeze({ operationId: record.id, canonicalRef: record.canonicalRef, route: "personal-core", readOnlyProjection: false });
    const candidates = [...this.#capabilities.values()].filter((candidate) => candidate.enabled && candidate.health !== "unavailable" && candidate.truthOwnerKey === record.truthOwnerKey && candidate.kinds.includes(record.kind) && (record.specialistProjectId === undefined || candidate.specialistProjectId === record.specialistProjectId));
    if (candidates.length !== 1) throw new Error(`Personal specialist route is ${candidates.length === 0 ? "missing" : "ambiguous"}: ${record.truthOwnerKey}`);
    return Object.freeze({ operationId: record.id, canonicalRef: record.canonicalRef, route: "specialist", capabilityKey: candidates[0]!.capabilityKey, readOnlyProjection: true });
  }
  project(request: Parameters<typeof projectPersonalOperations>[0], records: readonly PersonalOperationRecord[]): readonly PersonalOperationProjection[] { return projectPersonalOperations(request, records); }
}

const PERSONAL_OPERATION_TRANSITIONS: Readonly<Record<PersonalOperationRecord["status"], readonly PersonalOperationRecord["status"][]>> = Object.freeze({
  open: Object.freeze(["planned", "done", "cancelled"] as const),
  planned: Object.freeze(["done", "cancelled"] as const),
  done: Object.freeze([] as const),
  cancelled: Object.freeze([] as const)
});

export function transitionPersonalOperation(record: PersonalOperationRecord, nextStatus: PersonalOperationRecord["status"], evidenceRef: string): PersonalOperationRecord {
  validatePersonalOperations([record]);
  if (record.truthOwnerKey !== "personal-core") throw new Error("Specialist-owned personal operation must transition through its registered specialist capability");
  if (!PERSONAL_OPERATION_TRANSITIONS[record.status].includes(nextStatus)) throw new Error(`Illegal personal operation transition: ${record.status}->${nextStatus}`);
  return Object.freeze({ ...record, status: nextStatus, sourceRefs: Object.freeze([...new Set([...record.sourceRefs, required(evidenceRef, "Personal operation transition evidence")])]) });
}

// P8.4 — privacy-scoped follow-up recommendation and protected send preparation.
export interface FollowUpScope {
  readonly ownerId: string;
  readonly allowedSensitivities: readonly ContactRecord["sensitivity"][];
  readonly allowedContactIds?: readonly string[];
}

export interface ProtectedFollowUpSendIntent {
  readonly ownerId: string;
  readonly followUpId: string;
  readonly contactId: string;
  readonly ownerAuthorizationRef: string;
  readonly requiresProtectedActionGate: true;
  readonly protectedActionAuthorized: false;
}

export function recommendScopedFollowUps(scope: FollowUpScope, contacts: readonly ContactRecord[], followUps: readonly FollowUpRecord[], now: string): readonly FollowUpRecommendation[] {
  const owner = required(scope.ownerId, "Follow-up scope owner");
  const sensitivities = new Set(scope.allowedSensitivities);
  const contactIds = scope.allowedContactIds ? new Set(refs(scope.allowedContactIds, "Allowed contact ids", false)) : undefined;
  const allowedContacts = contacts.filter((contact) => contact.ownerId === owner && sensitivities.has(contact.sensitivity) && (!contactIds || contactIds.has(contact.id)));
  const allowedKeys = new Set(allowedContacts.map((contact) => contact.id));
  const allowedFollowUps = followUps.filter((followUp) => followUp.ownerId === owner && allowedKeys.has(followUp.contactId));
  return recommendFollowUps(allowedContacts, allowedFollowUps, now);
}

export function prepareFollowUpSend(recommendation: FollowUpRecommendation, ownerAuthorizationRef: string): ProtectedFollowUpSendIntent {
  if (recommendation.communicationBoundary === "recommend_only") throw new Error("Recommend-only follow-up cannot prepare a send");
  return Object.freeze({ ownerId: required(recommendation.ownerId, "Follow-up owner"), followUpId: required(recommendation.followUpId, "Follow-up id"), contactId: required(recommendation.contactId, "Follow-up contact"), ownerAuthorizationRef: required(ownerAuthorizationRef, "Follow-up owner authorization"), requiresProtectedActionGate: true, protectedActionAuthorized: false });
}

// P8.5 — one evidence-bearing resolution fans out to all linked resume routes without another owner prompt.
export interface NeedResumeReceipt {
  readonly resumeRef: string;
  readonly evidenceRefs: readonly string[];
  readonly protectedActionAuthorized: false;
}

export interface NeedResumeDispatcher {
  resume(resumeRef: string, resolution: NeedResolution): Promise<NeedResumeReceipt>;
}

export interface NeedResumeBatchReceipt {
  readonly ownerId: string;
  readonly needKey: string;
  readonly unlockRefs: readonly string[];
  readonly resumed: readonly NeedResumeReceipt[];
}

export async function resumeResolvedNeed(resolution: NeedResolution, dispatcher: NeedResumeDispatcher): Promise<NeedResumeBatchReceipt> {
  required(resolution.ownerId, "Needs Me resolution owner"); required(resolution.needKey, "Needs Me resolution key");
  refs(resolution.evidenceRefs, "Needs Me resolution evidence");
  const resumed: NeedResumeReceipt[] = [];
  for (const resumeRef of refs(resolution.resumeRefs, "Needs Me resume refs")) {
    const receipt = await dispatcher.resume(resumeRef, resolution);
    if (required(receipt.resumeRef, "Needs Me resume receipt") !== resumeRef) throw new Error("Needs Me resume receipt does not match requested route");
    if (receipt.protectedActionAuthorized !== false) throw new Error("Needs Me resume cannot expand protected-action authority");
    resumed.push(Object.freeze({ resumeRef, evidenceRefs: refs(receipt.evidenceRefs, "Needs Me resume evidence"), protectedActionAuthorized: false }));
  }
  return Object.freeze({ ownerId: resolution.ownerId, needKey: resolution.needKey, unlockRefs: refs(resolution.unlockRefs, "Needs Me unlock refs"), resumed: Object.freeze(resumed) });
}

// P8.6 — Foundry emits the setup manifest from versioned spec capability declarations.
export interface FoundrySetupCapabilityDeclaration {
  readonly capabilityRef: string;
  readonly requirements: readonly SetupRequirement[];
}

export interface FoundrySetupSpec {
  readonly projectId: string;
  readonly specVersion: number;
  readonly capabilities: readonly FoundrySetupCapabilityDeclaration[];
}

function setupShape(requirement: SetupRequirement): string {
  return JSON.stringify([requirement.kind, requirement.title, requirement.requiredEnvironment, requirement.ownerOnly, requirement.knownAtSpecTime]);
}

export function generateOnboardingManifest(spec: FoundrySetupSpec): OnboardingManifest {
  const projectId = required(spec.projectId, "Foundry setup project");
  if (!Number.isSafeInteger(spec.specVersion) || spec.specVersion < 1) throw new Error("Foundry setup specVersion must be positive");
  const merged = new Map<string, SetupRequirement>();
  for (const capability of spec.capabilities) {
    required(capability.capabilityRef, "Foundry setup capability ref");
    for (const requirement of capability.requirements) {
      required(requirement.id, "Setup requirement id");
      const prior = merged.get(requirement.id);
      if (prior && setupShape(prior) !== setupShape(requirement)) throw new Error(`Conflicting setup requirement declaration: ${requirement.id}`);
      const next = Object.freeze({ ...requirement, dependencyIds: Object.freeze([...new Set([...(prior?.dependencyIds ?? []), ...requirement.dependencyIds])]), unlockRefs: Object.freeze([...new Set([...(prior?.unlockRefs ?? []), ...requirement.unlockRefs])]) });
      merged.set(requirement.id, next);
    }
  }
  const manifest = Object.freeze({ projectId, specVersion: spec.specVersion, requirements: Object.freeze([...merged.values()].sort((a, b) => a.id.localeCompare(b.id))) });
  validateOnboardingManifest(manifest);
  return manifest;
}

export function onboardingNeeds(ownerId: string, manifest: OnboardingManifest, completedRequirementIds: readonly string[]): readonly OwnerNeed[] {
  const owner = required(ownerId, "Onboarding owner");
  return Object.freeze(knownSetupBlockers(manifest, completedRequirementIds).filter((blocker) => blocker.ownerOnly).map((blocker) => Object.freeze({
    id: `onboarding:${manifest.projectId}:${manifest.specVersion}:${blocker.requirementId}`,
    ownerId: owner,
    needKey: `onboarding:${manifest.projectId}:${manifest.specVersion}:${blocker.requirementId}`,
    title: blocker.title,
    reason: `Project setup prerequisite blocks ${blocker.unlockRefs.join(", ")}`,
    urgency: blocker.readyForOwnerAction ? "high" as const : "normal" as const,
    requiredEnvironment: blocker.requiredEnvironment,
    ownerAction: blocker.title,
    unlockRefs: Object.freeze([...blocker.unlockRefs]),
    resumeRefs: Object.freeze([`onboarding:${manifest.projectId}:${manifest.specVersion}:${blocker.requirementId}:resume`]),
    sourceRefs: Object.freeze([`foundry-spec:${manifest.projectId}@${manifest.specVersion}`]),
    state: "open" as const
  })));
}

// P8.7 — provider-neutral federated retrieval with query-time policy filtering.
export interface FederatedSearchProvider {
  readonly key: string;
  readonly domains: readonly string[];
  readonly enabled: boolean;
  readonly health: "available" | "degraded" | "unavailable";
  search(request: SearchRequest): Promise<readonly SearchDocument[]>;
}

export class FederatedSearchRuntime {
  readonly #providers = new Map<string, FederatedSearchProvider>();
  register(provider: FederatedSearchProvider): void {
    const key = required(provider.key, "Search provider key");
    if (provider.domains.length === 0 || provider.domains.some((domain) => !domain.trim())) throw new Error("Search provider domains are required");
    if (this.#providers.has(key)) throw new Error(`Search provider already exists: ${key}`);
    this.#providers.set(key, Object.freeze({ ...provider, domains: Object.freeze([...new Set(provider.domains.map((domain) => domain.trim()))]) }));
  }
  async search(request: SearchRequest): Promise<readonly SearchHit[]> {
    const allowed = new Set(request.allowedDomains);
    const documents = new Map<string, SearchDocument>();
    for (const provider of this.#providers.values()) {
      if (!provider.enabled || provider.health === "unavailable" || !provider.domains.some((domain) => allowed.has(domain))) continue;
      for (const document of await provider.search(request)) {
        if (!provider.domains.includes(document.domain)) throw new Error(`Search provider returned undeclared domain: ${provider.key}:${document.domain}`);
        const key = `${document.ownerId}:${document.domain}:${document.id}`;
        const prior = documents.get(key);
        const priorVersion = prior?.sourceVersion ?? 0, nextVersion = document.sourceVersion ?? 0;
        if (!prior || nextVersion > priorVersion) documents.set(key, document);
        else if (nextVersion === priorVersion && JSON.stringify(prior) !== JSON.stringify(document)) throw new Error(`Conflicting equal-version search projection: ${key}`);
      }
    }
    return federatedSearch(request, [...documents.values()]);
  }
}

export interface SearchProjectionStore {
  replaceProviderDocuments(providerKey: string, documents: readonly SearchDocument[]): Promise<void>;
}

export async function refreshSearchProvider(provider: FederatedSearchProvider, request: SearchRequest, store: SearchProjectionStore): Promise<number> {
  if (!provider.enabled || provider.health === "unavailable") throw new Error(`Search provider unavailable: ${provider.key}`);
  const documents = await provider.search(request);
  for (const document of documents) {
    if (!provider.domains.includes(document.domain)) throw new Error(`Search provider returned undeclared domain: ${provider.key}:${document.domain}`);
    if (document.ownerId !== request.ownerId) throw new Error("Search projection refresh crossed owner boundary");
  }
  await store.replaceProviderDocuments(provider.key, Object.freeze([...documents]));
  return documents.length;
}

// P8.8 — durable/shared preferences + acknowledgement store and replaceable delivery adapters.
export interface NotificationDeliveryReceipt {
  readonly channel: string;
  readonly intentIds: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface NotificationPolicyStore {
  load(ownerId: string, channel: string): Promise<NotificationChannelPolicy>;
  acknowledgedIntentIds(ownerId: string): Promise<readonly string[]>;
  saveAcknowledgement(acknowledgement: NotificationAcknowledgement): Promise<void>;
}

export interface NotificationDeliveryAdapter {
  readonly channel: string;
  readonly enabled: boolean;
  readonly health: "available" | "degraded" | "unavailable";
  deliver(notification: RoutedNotification): Promise<NotificationDeliveryReceipt>;
}

export class NotificationRuntime {
  readonly #policyStore: NotificationPolicyStore;
  readonly #adapters = new Map<string, NotificationDeliveryAdapter>();
  constructor(policyStore: NotificationPolicyStore) { this.#policyStore = policyStore; }
  register(adapter: NotificationDeliveryAdapter): void {
    const channel = required(adapter.channel, "Notification delivery channel");
    if (this.#adapters.has(channel)) throw new Error(`Notification delivery adapter already exists: ${channel}`);
    this.#adapters.set(channel, Object.freeze({ ...adapter }));
  }
  async routeAndDeliver(ownerId: string, channel: string, intents: readonly NotificationIntent[]): Promise<readonly NotificationDeliveryReceipt[]> {
    const owner = required(ownerId, "Notification owner"), channelKey = required(channel, "Notification channel");
    const adapter = this.#adapters.get(channelKey);
    if (!adapter || !adapter.enabled || adapter.health === "unavailable") throw new Error(`Notification delivery unavailable: ${channelKey}`);
    const policy = await this.#policyStore.load(owner, channelKey);
    if (policy.channel !== channelKey) throw new Error("Notification policy channel mismatch");
    const acknowledged = await this.#policyStore.acknowledgedIntentIds(owner);
    const routed = routeNotifications(intents.filter((intent) => intent.ownerId === owner), { ...policy, acknowledgedIntentIds: Object.freeze([...new Set([...(policy.acknowledgedIntentIds ?? []), ...acknowledged])]) });
    const receipts: NotificationDeliveryReceipt[] = [];
    for (const notification of routed) {
      if (notification.ownerId !== owner) throw new Error("Notification routing crossed owner boundary");
      const receipt = await adapter.deliver(notification);
      if (receipt.channel !== channelKey || receipt.intentIds.join("|") !== notification.intentIds.join("|")) throw new Error("Notification delivery receipt does not match routed notification");
      receipts.push(Object.freeze({ channel: receipt.channel, intentIds: Object.freeze([...receipt.intentIds]), evidenceRefs: refs(receipt.evidenceRefs, "Notification delivery evidence") }));
    }
    return Object.freeze(receipts);
  }
  async acknowledge(ownerId: string, intentId: string, acknowledgedAt: string, evidenceRefs: readonly string[]): Promise<NotificationAcknowledgement> {
    const acknowledgement = acknowledgeNotification(ownerId, intentId, acknowledgedAt, evidenceRefs);
    await this.#policyStore.saveAcknowledgement(acknowledgement);
    return acknowledgement;
  }
}

// P8.9 — schedule resolver owns cadence; Agency bridge owns execution; registry owns durable occurrence identity/history.
export interface AutomationScheduleResolver {
  due(scheduleRef: string, windowStart: string, windowEnd: string): Promise<readonly string[]>;
}

export interface AutomationAgencyReservation {
  readonly agencyExecutionRef: string;
  readonly evidenceRefs: readonly string[];
}

export interface AutomationAgencyResult {
  readonly state: "completed" | "failed";
  readonly evidenceRefs: readonly string[];
}

export interface AutomationAgencyBridge {
  reserve(input: Readonly<{ ownerId: string; automationId: string; projectId?: string; scheduledFor: string; idempotencyKey: string; actionPolicy: ScheduledAutomation["actionPolicy"] }>): Promise<AutomationAgencyReservation>;
  execute(reservation: AutomationAgencyReservation): Promise<AutomationAgencyResult>;
}

export interface AutomationAuthorityProvider {
  current(automation: ScheduledAutomation, scheduledFor: string, startedAt: string): Promise<AutomationAuthoritySnapshot | undefined>;
}

export interface ScheduledAutomationRunResult {
  readonly scheduledFor: string;
  readonly executionKey: string;
  readonly state: "completed" | "failed" | "already_recorded";
}

export async function dispatchScheduledAutomationWindow(options: Readonly<{ registry: AutomationRegistry; automation: ScheduledAutomation; resolver: AutomationScheduleResolver; agency: AutomationAgencyBridge; authorityProvider?: AutomationAuthorityProvider; windowStart: string; windowEnd: string; startedAt: string; maxCatchUp: number }>): Promise<readonly ScheduledAutomationRunResult[]> {
  const start = validTime(options.windowStart, "Automation window start"), end = validTime(options.windowEnd, "Automation window end"), started = validTime(options.startedAt, "Automation startedAt");
  if (end < start || started < start) throw new Error("Automation execution window is invalid");
  const due = await options.resolver.due(required(options.automation.scheduleRef, "Automation schedule reference"), options.windowStart, options.windowEnd);
  for (const occurrence of due) {
    const instant = validTime(occurrence, "Automation due occurrence");
    if (instant < start || instant > end) throw new Error("Automation schedule resolver returned out-of-window occurrence");
  }
  const completed = options.registry.exportSnapshot().executions.filter((execution) => execution.automationId === options.automation.id && execution.state === "completed").map((execution) => execution.scheduledFor);
  const planned = planAutomationCatchUp(due, completed, options.maxCatchUp);
  const results: ScheduledAutomationRunResult[] = [];
  for (const scheduledFor of planned) {
    if (validTime(scheduledFor, "Automation scheduled occurrence") > started) throw new Error("Automation schedule resolver returned a future occurrence");
    const executionKey = `${options.automation.id}:${scheduledFor}`;
    if (options.registry.execution(executionKey)) { results.push(Object.freeze({ scheduledFor, executionKey, state: "already_recorded" })); continue; }
    const idempotencyKey = `personal-automation:${encodeURIComponent(options.automation.ownerId)}:${encodeURIComponent(options.automation.id)}:${encodeURIComponent(scheduledFor)}`;
    const reservation = await options.agency.reserve(Object.freeze({ ownerId: options.automation.ownerId, automationId: options.automation.id, ...(options.automation.projectId !== undefined ? { projectId: options.automation.projectId } : {}), scheduledFor, idempotencyKey, actionPolicy: options.automation.actionPolicy }));
    required(reservation.agencyExecutionRef, "Automation Agency execution reference"); refs(reservation.evidenceRefs, "Automation reservation evidence");
    const authority = options.automation.actionPolicy === "safe_action" ? await options.authorityProvider?.current(options.automation, scheduledFor, options.startedAt) : undefined;
    options.registry.begin(options.automation.id, scheduledFor, options.startedAt, authority, reservation.agencyExecutionRef);
    const terminal = await options.agency.execute(reservation);
    options.registry.finish(executionKey, terminal.state, Object.freeze([...new Set([...reservation.evidenceRefs, ...refs(terminal.evidenceRefs, "Automation execution evidence")])]));
    results.push(Object.freeze({ scheduledFor, executionKey, state: terminal.state }));
  }
  return Object.freeze(results);
}

// P8.10 — verified observations advance state through optimistic concurrency; optional identity/time is not accepted at this boundary.
export interface DurableWatchState {
  readonly watch: ConditionWatch;
  readonly revision: string;
}

export interface WatchStateStore {
  load(ownerId: string, watchId: string): Promise<DurableWatchState | undefined>;
  compareAndSwap(ownerId: string, watchId: string, expectedRevision: string, next: ConditionWatch): Promise<string | undefined>;
}

export interface WatchObservationAdapter {
  readonly key: string;
  readonly enabled: boolean;
  readonly health: "available" | "degraded" | "unavailable";
  observe(watch: ConditionWatch): Promise<WatchObservation>;
}

export interface DurableWatchEvaluation {
  readonly decision: WatchDecision;
  readonly watch: ConditionWatch;
  readonly revision: string;
}

export async function evaluateDurableWatch(ownerId: string, watchId: string, store: WatchStateStore, adapter: WatchObservationAdapter): Promise<DurableWatchEvaluation> {
  const owner = required(ownerId, "Watch owner"), id = required(watchId, "Watch id");
  if (!adapter.enabled || adapter.health === "unavailable") throw new Error(`Watch observation provider unavailable: ${adapter.key}`);
  const current = await store.load(owner, id);
  if (!current || current.watch.ownerId !== owner || current.watch.id !== id) throw new Error(`Unknown scoped watch: ${owner}:${id}`);
  const observation = await adapter.observe(current.watch);
  if (!observation.observationId?.trim() || !observation.observedAt) throw new Error("Durable watch observation requires observationId and observedAt");
  validTime(observation.observedAt, "Watch observedAt");
  const decision = evaluateWatch(current.watch, observation);
  const canAdvanceVerifiedState = observation.verified && decision.reason !== "duplicate_observation" && decision.reason !== "stale_observation" && decision.reason !== "backoff_active";
  const next = Object.freeze({ ...current.watch, lastObservationId: observation.observationId, ...(canAdvanceVerifiedState ? { lastVerifiedObservedAt: observation.observedAt, priorVerifiedState: observation.conditionMet } : {}) });
  const revision = await store.compareAndSwap(owner, id, required(current.revision, "Watch revision"), next);
  if (!revision) throw new Error("Watch state changed concurrently; observation must be re-evaluated");
  return Object.freeze({ decision, watch: next, revision: required(revision, "Watch next revision") });
}

// P8.11 — independently derived bundle integrity + transactional restore with current authority acquisition.
function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Recovery integrity cannot hash a non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).filter((key) => object[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
  }
  throw new Error("Recovery integrity encountered unsupported value");
}

export async function calculatePersonalRecoveryIntegrity(snapshot: PersonalRecoverySnapshot): Promise<string> {
  const { integrityHash: _ignored, ...payload } = snapshot;
  const encoded = new TextEncoder().encode(canonicalJson(payload));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function sealPersonalRecoverySnapshot(snapshot: Omit<PersonalRecoverySnapshot, "integrityHash">): Promise<PersonalRecoverySnapshot> {
  const provisional = Object.freeze({ ...snapshot, integrityHash: "pending" });
  const integrityHash = await calculatePersonalRecoveryIntegrity(provisional);
  return Object.freeze({ ...snapshot, integrityHash });
}

export interface PersonalBackupCapture {
  readonly ownerId: string;
  readonly projectId: string;
  readonly domain: string;
  readonly sensitivityRank: number;
  readonly provenanceRefs: readonly string[];
  readonly records: readonly PersonalBackupRecord[];
  readonly completedOccurrenceKeys: readonly string[];
  readonly executionRefs: readonly string[];
  readonly receiptRefs: readonly string[];
  readonly completedEffectKeys: readonly string[];
}

export interface PersonalBackupSource {
  capture(ownerId: string, projectId: string, domain: string): Promise<PersonalBackupCapture>;
}

export async function capturePersonalRecoverySnapshot(input: Readonly<{ snapshotId: string; createdAt: string; ownerId: string; projectId: string; domain: string }>, source: PersonalBackupSource): Promise<PersonalRecoverySnapshot> {
  const ownerId = required(input.ownerId, "Backup owner"), projectId = required(input.projectId, "Backup project"), domain = required(input.domain, "Backup domain");
  validTime(input.createdAt, "Backup createdAt");
  const capture = await source.capture(ownerId, projectId, domain);
  if (capture.ownerId !== ownerId || capture.projectId !== projectId || capture.domain !== domain) throw new Error("Backup source crossed owner/project/domain boundary");
  for (const record of capture.records) if (record.ownerId !== ownerId || record.domain !== domain || (record.projectId !== undefined && record.projectId !== projectId)) throw new Error("Backup record crossed owner/project/domain boundary");
  return sealPersonalRecoverySnapshot(Object.freeze({
    schemaVersion: "cc-personal-recovery-v1",
    id: required(input.snapshotId, "Backup snapshot id"), ownerId, projectId, domain, createdAt: input.createdAt, sensitivityRank: capture.sensitivityRank,
    provenanceRefs: refs(capture.provenanceRefs, "Backup provenance"), records: Object.freeze([...capture.records]),
    completedOccurrenceKeys: refs(capture.completedOccurrenceKeys, "Backup completed occurrences", false),
    executionRefs: refs(capture.executionRefs, "Backup execution refs", false), receiptRefs: refs(capture.receiptRefs, "Backup receipt refs", false),
    completedEffectKeys: refs(capture.completedEffectKeys, "Backup completed effects", false)
  }));
}

export interface PersonalRecoveryContextProvider {
  current(snapshot: PersonalRecoverySnapshot): Promise<Omit<PersonalRecoveryContext, "trustedIntegrityHash">>;
}

export interface PersonalRecoveryTransaction {
  restoreRecord(record: PersonalBackupRecord): Promise<void>;
  recordApplication(application: PersonalRecoveryApplication, evidenceRefs: readonly string[]): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface PersonalRecoveryStore {
  begin(snapshot: PersonalRecoverySnapshot): Promise<PersonalRecoveryTransaction>;
}

export async function applyPersonalRecoveryTransaction(snapshot: PersonalRecoverySnapshot, contextProvider: PersonalRecoveryContextProvider, store: PersonalRecoveryStore): Promise<PersonalRecoveryApplication> {
  const computed = await calculatePersonalRecoveryIntegrity(snapshot);
  if (computed !== snapshot.integrityHash) throw new Error("Personal recovery integrity verification failed");
  const current = await contextProvider.current(snapshot);
  const context: PersonalRecoveryContext = Object.freeze({ ...current, trustedIntegrityHash: computed });
  const plan = planPersonalRecovery(snapshot, context);
  if (!plan.canApply) throw new Error(`Personal recovery cannot apply: ${plan.reason}`);
  const transaction = await store.begin(snapshot);
  try {
    for (const id of plan.acceptedRecordIds) {
      const record = snapshot.records.find((candidate) => candidate.id === id);
      if (!record) throw new Error(`Recovery plan references missing record: ${id}`);
      await transaction.restoreRecord(record);
    }
    const application = applyPersonalRecovery(snapshot, context);
    await transaction.recordApplication(application, refs(snapshot.provenanceRefs, "Recovery application evidence"));
    await transaction.commit();
    return application;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
