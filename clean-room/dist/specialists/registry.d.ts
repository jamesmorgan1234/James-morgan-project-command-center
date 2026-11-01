import { type SpecialistProjectProfile } from "./contracts.js";
import type { SpecialistModelContract } from "../brain/specialists.js";
export declare class SpecialistRegistry {
    #private;
    registerType(typeKey: string): void;
    /** Legacy C6 projection registration retained until every project has a PIF.3 canonical specialist reference. */
    register(profile: SpecialistProjectProfile): void;
    /** PIF.3 path: project profile is only a scoped projection of the canonical Brain-owned specialist. */
    registerCanonical(profile: SpecialistProjectProfile, model: SpecialistModelContract): void;
    get(projectId: string): SpecialistProjectProfile | undefined;
    remove(projectId: string): SpecialistProjectProfile;
    list(): readonly SpecialistProjectProfile[];
}
