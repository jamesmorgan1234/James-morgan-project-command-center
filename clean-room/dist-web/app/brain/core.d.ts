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
export declare class BrainCore {
    classifyAction(intent: BrainIntent): BrainActionClass;
    wrap<T>(request: BrainRequest, output: T, evidenceRefs: readonly string[]): BrainResponseEnvelope<T>;
}
