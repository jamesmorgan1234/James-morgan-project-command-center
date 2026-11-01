import type { AuthSessionStore } from '../security/auth.js';
import type { ProtectedActionGate } from '../security/protected-gate.js';
import type { ProtectedAuthorizationRegistry } from '../security/protected-authorizations.js';
import { type RecoveryAccess, type RecoveryOperation, type RecoveryScope } from './contracts.js';
export declare function recoveryIntent(operation: RecoveryOperation, scope: RecoveryScope, reference: string): {
    action: string;
    ownerId: string;
    scope: RecoveryScope;
    targetResourceId: string;
    parameters: {
        recoveryScope: string;
        isolatedOnly: boolean;
    };
    maximumCostCents: number;
};
/** Uses current C2 sessions/policy and exact owner-verified grants. Never issues grants. */
export declare function recoveryC2Access(gate: ProtectedActionGate, grants: ProtectedAuthorizationRegistry, sessions: AuthSessionStore, sessionId: string, now: () => string, evidence: RecoveryAccess['evidence'], authorizationId: (operation: RecoveryOperation, scope: RecoveryScope, reference: string) => string | undefined): RecoveryAccess;
