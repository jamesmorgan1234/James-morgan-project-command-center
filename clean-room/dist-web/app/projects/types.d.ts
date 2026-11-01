export type ProjectLifecycle = "candidate" | "active" | "paused" | "blocked" | "completed" | "archived" | "superseded";
export type ProjectPriority = "critical" | "high" | "normal" | "low";
export type ProjectVerification = "verified" | "implemented_unverified" | "partial" | "blocked" | "unknown";
export interface ProjectRecord {
    readonly id: string;
    readonly typeKey: string;
    readonly ownerId: string;
    readonly companyId?: string;
    readonly name: string;
    readonly mission: string;
    readonly lifecycle: ProjectLifecycle;
    readonly status: string;
    readonly verification: ProjectVerification;
    readonly priority: ProjectPriority;
    readonly version: number;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly agentAccessEnabled: boolean;
    readonly portfolioAutoEnabled: boolean;
    readonly protected: boolean;
}
export interface ProjectTypeDefinition {
    readonly key: string;
    readonly version: number;
    readonly label: string;
    readonly capabilities: readonly string[];
    readonly requiredDetailSections: readonly string[];
    readonly domainPlaybookKey: string;
}
export declare function assertProjectRecord(project: ProjectRecord): void;
