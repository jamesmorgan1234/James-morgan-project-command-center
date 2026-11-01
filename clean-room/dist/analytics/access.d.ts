import { AuthSessionStore } from "../security/auth.js";
import { ProtectedActionGate } from '../security/protected-gate.js';
import { ProtectedAuthorizationRegistry } from '../security/protected-authorizations.js';
import type { EnvironmentName } from '../kernel/config.js';
import type { AnalyticsAccess, AnalyticsScope } from './contracts.js';
export declare function analyticsAccessIntent(operation: string, scope: AnalyticsScope, reference: string, environment: EnvironmentName): {
    action: string;
    ownerId: string;
    scope: {
        ownerId: string;
        companyId: string;
        projectId: string;
        environment: EnvironmentName;
    };
    targetResourceId: string;
    parameters: {
        brainId: string;
    };
    maximumCostCents: number;
};
/** Current C2 policy/session checks; analytics creates no grants or alternate security path. */
export declare function analyticsC2Access(gate: ProtectedActionGate, grants: ProtectedAuthorizationRegistry, sessions: AuthSessionStore, sessionId: string, environment: EnvironmentName, now: () => string, evidence: AnalyticsAccess['evidence'], exportAuthorizationId: (scope: AnalyticsScope, reference: string) => string | undefined): AnalyticsAccess;
