export interface DeterministicCapability {
    readonly key: string;
    readonly requiresAi: boolean;
    readonly availableOffline: boolean;
}
export declare function capabilitiesWithoutExternalAi(capabilities: readonly DeterministicCapability[]): readonly DeterministicCapability[];
export declare function assertCoreTruthSurvivesAiOutage(capabilities: readonly DeterministicCapability[]): void;
