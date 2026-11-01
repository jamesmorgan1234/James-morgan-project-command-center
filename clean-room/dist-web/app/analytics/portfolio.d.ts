export interface ProjectDeliveryMetric {
    readonly projectId: string;
    readonly verifiedCompleted: number;
    readonly verifiedTotal: number | null;
    readonly agencyCompleted: number;
    readonly agencyTotal: number | null;
    readonly cycleTimeMs: number | null;
    readonly blockedTimeMs: number;
    readonly ownerWaitTimeMs: number;
    readonly evidenceRefs: readonly string[];
}
export declare function projectAnalytics(metric: ProjectDeliveryMetric): Readonly<{
    projectPercent: number | null;
    agencyPercent: number | null;
    cycleTimeMs: number | null;
    blockedTimeMs: number;
    ownerWaitTimeMs: number;
}>;
import { type RequirementClosureRecord } from '../kernel/evidence.js';
import { type AnalyticsScope, type AnalyticsAccess } from './contracts.js';
export interface PortfolioRequirement {
    readonly scope: AnalyticsScope;
    readonly closure: RequirementClosureRecord;
    readonly dependencyIds: readonly string[];
    readonly blockedIntervals: readonly {
        start: string;
        end: string;
    }[];
    readonly ownerWaitIntervals: readonly {
        start: string;
        end: string;
    }[];
    readonly startedAt: string | null;
    readonly deliveredAt: string | null;
    readonly milestoneRef: string;
    readonly risk: 'low' | 'medium' | 'high';
    readonly resourceUnits: number | null;
}
export declare function intervalDuration(intervals: readonly {
    start: string;
    end: string;
}[]): number;
export declare function evidencePortfolio(access: AnalyticsAccess, scope: AnalyticsScope, records: readonly PortfolioRequirement[], denominator: {
    readonly requirementIds: readonly string[];
    readonly evidenceIds: readonly string[];
} | null, agency: {
    readonly completed: number;
    readonly total: number | null;
    readonly evidenceIds: readonly string[];
} | null): {
    authorizationGranted: boolean;
    projectPercent: number | null;
    agencyPercent: number | null;
    cycleTimeMs: number | null;
    blockedTimeMs: number;
    ownerWaitTimeMs: number;
    scope: AnalyticsScope;
    verifiedCompleted: number;
    deliveredCount: number;
    throughputPerHour: number | null;
    measurementWindow: {
        start: string;
        end: string;
    } | null;
    riskCounts: {
        [k: string]: number;
    };
    resourceUnits: number | null;
    milestones: {
        reference: string;
        state: "blocked" | "verified" | "planned" | "implemented_unverified" | "not_applicable";
    }[];
    denominatorTrusted: boolean;
    statuses: Record<string, number>;
    unresolvedDependencyIds: string[];
};
export declare function authorizedPortfolioRollup(access: AnalyticsAccess, projects: readonly {
    scope: AnalyticsScope;
    verified: number;
    total: number | null;
    evidenceIds: readonly string[];
}[]): {
    projects: number;
    verified: number;
    total: number | null;
    percent: number | null;
    underlyingPrivateContentIncluded: boolean;
    authorizationGranted: boolean;
};
