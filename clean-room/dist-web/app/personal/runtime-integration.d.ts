import { type CalendarChangeIntent, type CalendarEventRecord, type CalendarReconciliationResult } from "./calendar.js";
import { projectPersonalOperations, type PersonalOperationKind, type PersonalOperationRecord, type PersonalOperationProjection } from "./operations.js";
import { type ContactRecord, type FollowUpRecord, type FollowUpRecommendation } from "./contacts.js";
import { type NeedResolution, type OwnerNeed } from "./needs-me.js";
import { type OnboardingManifest, type SetupRequirement } from "./onboarding.js";
import { type SearchDocument, type SearchHit, type SearchRequest } from "./search.js";
import { type NotificationAcknowledgement, type NotificationChannelPolicy, type NotificationIntent, type RoutedNotification } from "./notifications.js";
import { AutomationRegistry, type AutomationAuthoritySnapshot, type ScheduledAutomation } from "./automations.js";
import { type ConditionWatch, type WatchDecision, type WatchObservation } from "./watches.js";
import { type PersonalBackupRecord, type PersonalRecoveryApplication, type PersonalRecoveryContext, type PersonalRecoverySnapshot } from "./recovery.js";
import { TaskLedger, type TaskOccurrence, type TaskPersistenceSnapshot } from "./tasks.js";
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
export declare function loadTaskLedger(ownerId: string, store: TaskSnapshotStore): Promise<Readonly<{
    ledger: TaskLedger;
    revision?: string;
}>>;
export declare function saveTaskLedger(ownerId: string, ledger: TaskLedger, store: TaskSnapshotStore, expectedRevision?: string): Promise<string>;
export declare function reserveTaskOccurrenceForAgency(ledger: TaskLedger, input: Readonly<{
    taskId: string;
    occurrenceKey: string;
    scheduledFor: string;
    evidenceRefs: readonly string[];
    pifTraceRef?: string;
}>, agency: TaskOccurrenceAgencyBridge): Promise<TaskOccurrence>;
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
export declare class CalendarRuntimeRegistry {
    #private;
    register(provider: CalendarProviderRuntimeAdapter): void;
    provider(key: string, capability: CalendarRuntimeCapability): CalendarProviderRuntimeAdapter;
    availability(providerKey: string, ownerId: string, startsAt: string, endsAt: string): Promise<readonly CalendarBusyWindow[]>;
    verifyExternalChange(local: CalendarEventRecord): Promise<CalendarChangeVerification>;
    applyOwnerChange(providerKey: string, ownerId: string, intent: CalendarChangeIntent, event: CalendarEventRecord): Promise<CalendarChangeVerification>;
}
export interface CalendarReminderSchedule {
    readonly ownerId: string;
    readonly eventId: string;
    readonly scheduledFor: string;
    readonly dedupeKey: string;
    readonly sourceRef: string;
}
export declare function planCalendarReminder(event: CalendarEventRecord, scheduledFor: string): CalendarReminderSchedule;
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
export declare class PersonalOperationCapabilityRegistry {
    #private;
    register(capability: PersonalOperationSpecialistCapability): void;
    route(record: PersonalOperationRecord): PersonalOperationRoute;
    project(request: Parameters<typeof projectPersonalOperations>[0], records: readonly PersonalOperationRecord[]): readonly PersonalOperationProjection[];
}
export declare function transitionPersonalOperation(record: PersonalOperationRecord, nextStatus: PersonalOperationRecord["status"], evidenceRef: string): PersonalOperationRecord;
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
export declare function recommendScopedFollowUps(scope: FollowUpScope, contacts: readonly ContactRecord[], followUps: readonly FollowUpRecord[], now: string): readonly FollowUpRecommendation[];
export declare function prepareFollowUpSend(recommendation: FollowUpRecommendation, ownerAuthorizationRef: string): ProtectedFollowUpSendIntent;
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
export declare function resumeResolvedNeed(resolution: NeedResolution, dispatcher: NeedResumeDispatcher): Promise<NeedResumeBatchReceipt>;
export interface FoundrySetupCapabilityDeclaration {
    readonly capabilityRef: string;
    readonly requirements: readonly SetupRequirement[];
}
export interface FoundrySetupSpec {
    readonly projectId: string;
    readonly specVersion: number;
    readonly capabilities: readonly FoundrySetupCapabilityDeclaration[];
}
export declare function generateOnboardingManifest(spec: FoundrySetupSpec): OnboardingManifest;
export declare function onboardingNeeds(ownerId: string, manifest: OnboardingManifest, completedRequirementIds: readonly string[]): readonly OwnerNeed[];
export interface FederatedSearchProvider {
    readonly key: string;
    readonly domains: readonly string[];
    readonly enabled: boolean;
    readonly health: "available" | "degraded" | "unavailable";
    search(request: SearchRequest): Promise<readonly SearchDocument[]>;
}
export declare class FederatedSearchRuntime {
    #private;
    register(provider: FederatedSearchProvider): void;
    search(request: SearchRequest): Promise<readonly SearchHit[]>;
}
export interface SearchProjectionStore {
    replaceProviderDocuments(providerKey: string, documents: readonly SearchDocument[]): Promise<void>;
}
export declare function refreshSearchProvider(provider: FederatedSearchProvider, request: SearchRequest, store: SearchProjectionStore): Promise<number>;
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
export declare class NotificationRuntime {
    #private;
    constructor(policyStore: NotificationPolicyStore);
    register(adapter: NotificationDeliveryAdapter): void;
    routeAndDeliver(ownerId: string, channel: string, intents: readonly NotificationIntent[]): Promise<readonly NotificationDeliveryReceipt[]>;
    acknowledge(ownerId: string, intentId: string, acknowledgedAt: string, evidenceRefs: readonly string[]): Promise<NotificationAcknowledgement>;
}
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
    reserve(input: Readonly<{
        ownerId: string;
        automationId: string;
        projectId?: string;
        scheduledFor: string;
        idempotencyKey: string;
        actionPolicy: ScheduledAutomation["actionPolicy"];
    }>): Promise<AutomationAgencyReservation>;
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
export declare function dispatchScheduledAutomationWindow(options: Readonly<{
    registry: AutomationRegistry;
    automation: ScheduledAutomation;
    resolver: AutomationScheduleResolver;
    agency: AutomationAgencyBridge;
    authorityProvider?: AutomationAuthorityProvider;
    windowStart: string;
    windowEnd: string;
    startedAt: string;
    maxCatchUp: number;
}>): Promise<readonly ScheduledAutomationRunResult[]>;
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
export declare function evaluateDurableWatch(ownerId: string, watchId: string, store: WatchStateStore, adapter: WatchObservationAdapter): Promise<DurableWatchEvaluation>;
export declare function calculatePersonalRecoveryIntegrity(snapshot: PersonalRecoverySnapshot): Promise<string>;
export declare function sealPersonalRecoverySnapshot(snapshot: Omit<PersonalRecoverySnapshot, "integrityHash">): Promise<PersonalRecoverySnapshot>;
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
export declare function capturePersonalRecoverySnapshot(input: Readonly<{
    snapshotId: string;
    createdAt: string;
    ownerId: string;
    projectId: string;
    domain: string;
}>, source: PersonalBackupSource): Promise<PersonalRecoverySnapshot>;
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
export declare function applyPersonalRecoveryTransaction(snapshot: PersonalRecoverySnapshot, contextProvider: PersonalRecoveryContextProvider, store: PersonalRecoveryStore): Promise<PersonalRecoveryApplication>;
