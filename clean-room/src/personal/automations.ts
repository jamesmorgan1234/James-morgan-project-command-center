import { parseTimestamp } from "../security/types.js";

export interface ScheduledAutomation {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly scheduleRef: string;
  readonly enabled: boolean;
  readonly actionPolicy: "notification_only" | "safe_action";
  readonly providerHealth: "available" | "degraded" | "unavailable";
  readonly protectedActionsAuthorized: false;
}

export interface AutomationExecution {
  readonly automationId: string;
  readonly scheduledFor: string;
  readonly startedAt: string;
  readonly state: "started" | "completed" | "failed";
  readonly evidenceRefs: readonly string[];
}

export class AutomationRegistry {
  readonly #automations = new Map<string, ScheduledAutomation>();
  readonly #executions = new Map<string, AutomationExecution>();

  register(automation: ScheduledAutomation): void {
    if (!automation.id.trim() || !automation.ownerId.trim() || !automation.scheduleRef.trim()) throw new Error("Automation identity/owner/schedule are required");
    if (this.#automations.has(automation.id)) throw new Error(`Automation already exists: ${automation.id}`);
    this.#automations.set(automation.id, Object.freeze({ ...automation }));
  }

  begin(automationId: string, scheduledFor: string, startedAt: string): string {
    const automation = this.#automations.get(automationId);
    if (!automation || !automation.enabled) throw new Error(`Automation unavailable: ${automationId}`);
    if (automation.providerHealth === "unavailable") throw new Error("Automation provider unavailable");
    parseTimestamp(scheduledFor, "scheduledFor");
    parseTimestamp(startedAt, "startedAt");
    const key = `${automationId}:${scheduledFor}`;
    if (this.#executions.has(key)) throw new Error(`Duplicate scheduled execution blocked: ${key}`);
    this.#executions.set(key, Object.freeze({ automationId, scheduledFor, startedAt, state: "started" as const, evidenceRefs: Object.freeze([]) }));
    return key;
  }

  finish(executionKey: string, state: "completed" | "failed", evidenceRefs: readonly string[]): void {
    const current = this.#executions.get(executionKey);
    if (!current) throw new Error(`Unknown automation execution: ${executionKey}`);
    if (evidenceRefs.length === 0) throw new Error("Automation completion/failure requires evidence");
    this.#executions.set(executionKey, Object.freeze({ ...current, state, evidenceRefs: Object.freeze([...evidenceRefs]) }));
  }

  execution(executionKey: string): AutomationExecution | undefined { return this.#executions.get(executionKey); }
}
