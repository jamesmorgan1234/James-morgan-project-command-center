export type SteeringCommand = "pause" | "resume" | "reprioritize" | "change" | "redirect";
export interface ActivePlanUnit {
    readonly id: string;
    readonly dependencyIds: readonly string[];
    readonly verified: boolean;
    readonly authorizationScope: readonly string[];
}
export interface SteeringResult {
    readonly preservedVerifiedIds: readonly string[];
    readonly invalidatedIds: readonly string[];
    readonly requiresAuthorizationRecheck: boolean;
}
export declare function applySteering(command: SteeringCommand, affectedIds: readonly string[], units: readonly ActivePlanUnit[]): SteeringResult;
