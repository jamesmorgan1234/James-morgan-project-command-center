import { type SpecialistModelContract } from "../brain/specialists.js";
export interface SpecialistFrameworkContract {
    readonly typeKey: string;
    readonly ownerId: string;
    readonly version: number;
    readonly specialistId: string;
    readonly specialistVersion: number;
    readonly capabilityOwners: Readonly<Record<string, string>>;
    readonly dataContracts: readonly string[];
    readonly brainHooks: readonly string[];
    readonly agencyHooks: readonly string[];
    readonly detailSections: readonly string[];
    readonly metricKeys: readonly string[];
    readonly providerAdapters: readonly string[];
    readonly isolationClass: string;
    readonly sourceRefs: readonly string[];
}
export declare function validateSpecialistFrameworkContract(contract: SpecialistFrameworkContract): SpecialistFrameworkContract;
export declare function validateCanonicalSpecialistFrameworkContract(contract: SpecialistFrameworkContract, model: SpecialistModelContract): SpecialistFrameworkContract;
export declare class SpecialistFrameworkRegistry {
    #private;
    register(contract: SpecialistFrameworkContract, model: SpecialistModelContract): SpecialistFrameworkContract;
    require(ownerId: string, typeKey: string): SpecialistFrameworkContract;
}
