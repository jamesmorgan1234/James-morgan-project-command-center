export interface BookExecutionPolicy {
    readonly projectId: string;
    readonly portfolioAgentAutoAllowed: boolean;
    readonly normalChatScope: readonly string[];
    readonly workScope: readonly string[];
}
export declare const DEFAULT_BOOK_EXECUTION_POLICY: BookExecutionPolicy;
export declare function assertBookExecutionAllowed(policy: BookExecutionPolicy, action: string, executor: "portfolio_agent" | "normal_chat" | "work"): void;
export type BookExecutorKind = "brain" | "foundry" | "project_agent" | "portfolio_agent" | "normal_chat" | "work";
export type BookExecutionAction = "planning" | "research" | "writing" | "editing" | "artwork" | "interior" | "cover" | "formatting" | "metadata_preparation" | "qc" | "package_creation" | "recovery" | "evidence" | "publishing_account_browser_upload" | "previewer" | "submission" | "provider_account_bound_publishing";
export interface EvidenceBackedBookExecutionPolicy {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly version: number;
    readonly portfolioAgentAutoAllowed: boolean;
    readonly normalChatScope: readonly BookExecutionAction[];
    readonly workScope: readonly BookExecutionAction[];
    readonly brainScope: readonly BookExecutionAction[];
    readonly foundryScope: readonly BookExecutionAction[];
    readonly projectAgentScope: readonly BookExecutionAction[];
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export interface BookExecutionRequest {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId?: string | undefined;
    readonly action: BookExecutionAction;
    readonly executor: BookExecutorKind;
    readonly exactTargetRef: string;
    readonly authorizationRef?: string | undefined;
    readonly observedAt: string;
}
export interface BookExecutionDecision {
    readonly requestId: string;
    readonly allowed: boolean;
    readonly reason: "allowed" | "portfolio_agent_excluded" | "outside_executor_scope" | "work_publishing_only" | "missing_exact_target" | "missing_protected_authorization";
    readonly executor: BookExecutorKind;
    readonly action: BookExecutionAction;
    readonly exactTargetRef: string;
}
export declare function validateEvidenceBackedBookExecutionPolicy(policy: EvidenceBackedBookExecutionPolicy): EvidenceBackedBookExecutionPolicy;
export declare function assessBookExecution(policy: EvidenceBackedBookExecutionPolicy, request: BookExecutionRequest): BookExecutionDecision;
export declare const DEFAULT_EVIDENCE_BACKED_BOOK_POLICY: EvidenceBackedBookExecutionPolicy;
