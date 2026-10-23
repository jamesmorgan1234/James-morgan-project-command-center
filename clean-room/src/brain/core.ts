export type BrainIntent = "question" | "owner_input" | "decision" | "rule_change" | "idea" | "research" | "proposal" | "agent_request" | "protected_action_request";
export type BrainActionClass = "informational" | "proposal" | "execution_request" | "protected";

export interface BrainRequest {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly intent: BrainIntent;
  readonly text: string;
  readonly contextSnapshotId: string;
}

export interface BrainResponseEnvelope<T> {
  readonly requestId: string;
  readonly actionClass: BrainActionClass;
  readonly output: Readonly<T>;
  readonly evidenceRefs: readonly string[];
  readonly canonicalWritesAuthorized: false;
}

export class BrainCore {
  classifyAction(intent: BrainIntent): BrainActionClass {
    if (["question", "research"].includes(intent)) return "informational";
    if (["idea", "proposal", "owner_input", "decision", "rule_change"].includes(intent)) return "proposal";
    if (intent === "protected_action_request") return "protected";
    return "execution_request";
  }

  wrap<T>(request: BrainRequest, output: T, evidenceRefs: readonly string[]): BrainResponseEnvelope<T> {
    if (!request.id.trim() || !request.ownerId.trim() || !request.text.trim() || !request.contextSnapshotId.trim()) throw new Error("Brain request identity/text/context are required");
    return Object.freeze({ requestId: request.id, actionClass: this.classifyAction(request.intent), output: Object.freeze({ ...output }), evidenceRefs: Object.freeze([...evidenceRefs]), canonicalWritesAuthorized: false as const });
  }
}
