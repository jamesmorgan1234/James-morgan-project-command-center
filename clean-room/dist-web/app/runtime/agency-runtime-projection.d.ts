import type { RuntimeAgencySnapshot } from "./snapshot.js";
type JsonRecord = Record<string, unknown>;
export declare function buildRuntimeAgencySnapshot(input: Readonly<{
    runs: readonly JsonRecord[];
    jobs: readonly JsonRecord[];
    tasks: readonly JsonRecord[];
    observedAt: string;
    unavailable: boolean;
}>): RuntimeAgencySnapshot;
export {};
