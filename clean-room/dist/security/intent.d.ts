import { type ExecutionScope } from "../kernel/scope.js";
export interface ProtectedIntent {
    readonly action: string;
    readonly ownerId: string;
    readonly scope: ExecutionScope;
    readonly targetResourceId: string;
    readonly parameters: Readonly<Record<string, unknown>>;
    readonly maximumCostCents: number;
}
export declare function createIntentBinding(intent: ProtectedIntent): string;
export declare function assertIntentBinding(intent: ProtectedIntent, authorizedBinding: string): void;
