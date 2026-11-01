export interface LeadDefinition {
    readonly key: string;
    readonly capabilities: readonly string[];
    readonly projectTypeKeys: readonly string[];
    readonly authorityScopes: readonly string[];
    readonly maxConcurrentAssignments: number;
    readonly healthy: boolean;
}
export declare class LeadRegistry {
    #private;
    register(lead: LeadDefinition): void;
    assemble(input: {
        capability: string;
        projectTypeKey: string;
        requiredAuthorityScopes: readonly string[];
        workloadByLead: Readonly<Record<string, number>>;
    }): LeadDefinition;
}
