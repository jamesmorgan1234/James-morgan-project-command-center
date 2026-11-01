import { type TruthValue } from "../data/canonical.js";
import type { NeedsMeQueue } from "../personal/needs-me.js";
import type { ProjectCheckpointStore } from "../projects/checkpoints.js";
import type { ProjectRegistry } from "../projects/registry.js";
import type { ProjectRoadmap } from "../projects/roadmap.js";
import type { CommandCenterRuntimeSnapshot, RuntimeEvidenceRef, SurfaceAvailability } from "./snapshot.js";
export interface RuntimeRoadmapSource {
    readonly roadmap: ProjectRoadmap;
    readonly denominatorTrusted: boolean;
}
export interface RuntimeSurfaceReader {
    readonly key: string;
    readonly label: string;
    read(): Readonly<{
        availability: SurfaceAvailability;
        summary: TruthValue<string>;
        evidence: readonly RuntimeEvidenceRef[];
    }>;
}
export interface CanonicalRuntimeAssemblyOptions {
    readonly providerId: string;
    readonly observedAt: string;
    readonly sourceRef: string;
    readonly projects: ProjectRegistry;
    readonly checkpoints: ProjectCheckpointStore;
    readonly needsMe: NeedsMeQueue;
    readonly roadmaps?: ReadonlyMap<string, RuntimeRoadmapSource>;
    readonly surfaceReaders?: readonly RuntimeSurfaceReader[];
    readonly ownerDisplayName?: string;
    readonly releaseId?: string;
    readonly knownGoodReleaseId?: string;
}
export declare function assembleCanonicalRuntimeSnapshot(options: CanonicalRuntimeAssemblyOptions): CommandCenterRuntimeSnapshot;
