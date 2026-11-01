import type { AuthSessionStore } from "../security/auth.js";
import { type FinancialDataAccessRequest } from "./isolation.js";
/** Trusted server capability; never accept it from a client, Brain, or provider. */
export interface FinancialSessionCapability {
    readonly sessionId: string;
    readonly ownerId: string;
    readonly scopeId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly dataClasses: readonly string[];
    readonly canWrite: boolean;
    readonly verifiedAt: string;
    readonly expiresAt: string;
}
export interface FinancialResourceScope {
    readonly ownerId: string;
    readonly scopeId: string;
    readonly companyId?: string;
    readonly projectId?: string;
}
/** Trusted server composition only. Pure finance models are not authorization entry points. */
export declare class FinancialAccessBoundary {
    readonly sessions: AuthSessionStore;
    readonly lookup: (sessionId: string, scopeId: string) => FinancialSessionCapability | undefined;
    readonly contained: (ownerId: string, scopeId: string) => boolean;
    constructor(sessions: AuthSessionStore, lookup: (sessionId: string, scopeId: string) => FinancialSessionCapability | undefined, contained: (ownerId: string, scopeId: string) => boolean);
    authorize(sessionId: string, resource: FinancialResourceScope, now: string, request: Omit<FinancialDataAccessRequest, "allowedDataClasses">, write?: boolean): import("./isolation.js").FinancialDataAccessDecision;
}
