import { type AssuranceLevel } from "../security/types.js";
export interface FinancialAccessEnvelope {
    readonly ownerId: string;
    readonly subjectOwnerId: string;
    readonly assurance: AssuranceLevel;
    readonly scopes: readonly string[];
    readonly contextDomain: string;
    readonly companyId?: string;
    readonly resourceCompanyId?: string;
    readonly credentialRef?: string;
}
export declare function assertFinancialReadIsolation(envelope: FinancialAccessEnvelope): void;
export declare function assertFinancialWriteIsolation(envelope: FinancialAccessEnvelope): void;
export type FinancialIncidentState = "normal" | "non_financial_compromise" | "finance_containment";
export interface FinancialDataAccessRequest {
    readonly requestedDataClasses: readonly string[];
    readonly allowedDataClasses: readonly string[];
    readonly auditRef: string;
    readonly incidentState: FinancialIncidentState;
}
export interface FinancialDataAccessDecision {
    readonly allowed: true;
    readonly dataClasses: readonly string[];
    readonly auditRef: string;
    readonly incidentState: FinancialIncidentState;
    readonly secretsExposed: false;
    readonly credentialRefsExposed: readonly [];
    readonly protectedActionAuthorized: false;
}
export declare function evaluateFinancialDataAccess(envelope: FinancialAccessEnvelope, request: FinancialDataAccessRequest): FinancialDataAccessDecision;
