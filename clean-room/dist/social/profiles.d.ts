export type SocialProviderCapability = "compose" | "publish" | "schedule" | "short_form_video" | "comments" | "mentions" | "direct_messages" | "listening" | "analytics" | "ads" | "account_metadata";
export interface SocialProviderDefinition {
    readonly id: string;
    readonly ownerId: string;
    readonly platform: string;
    readonly version: number;
    readonly adapterId: string;
    readonly adapterVersion: number;
    readonly capabilities: readonly SocialProviderCapability[];
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export interface PlatformComplianceProfile {
    readonly key: string;
    readonly ownerId: string;
    readonly platform: string;
    readonly version: number;
    readonly adapterId: string;
    readonly adapterVersion: number;
    readonly maxCaptionChars: number;
    readonly allowedMediaKinds: readonly string[];
    readonly requiredDisclosureTags: readonly string[];
    readonly providerConstraints: Readonly<Record<string, string | number | boolean>>;
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
    readonly publishScope?: string;
    readonly policyVersion?: string;
    readonly deprecatedAt?: string;
}
export interface LegacyPlatformComplianceProfile {
    readonly key: string;
    readonly platform: string;
    readonly version: number;
    readonly maxCaptionChars: number;
    readonly allowedMediaKinds: readonly string[];
    readonly requiredDisclosureTags: readonly string[];
    readonly sourceRef: string;
}
export interface PlatformTransformInput {
    readonly caption: string;
    readonly mediaKind: string;
    readonly disclosures: readonly string[];
    readonly metadata?: Readonly<Record<string, number | string | boolean>>;
    readonly rightsEvidenceRefs?: readonly string[];
    readonly now?: string;
}
export interface PlatformTransformResult {
    readonly caption: string;
    readonly mediaKind: string;
    readonly disclosures: readonly string[];
    readonly profileKey: string;
    readonly profileVersion: number;
    readonly adapterId: string;
    readonly adapterVersion: number;
}
export interface PlatformTransformAdapter {
    readonly id: string;
    readonly platform: string;
    readonly version: number;
    readonly implementationRef: string;
    readonly sourceRefs: readonly string[];
    readonly transform: (input: PlatformTransformInput, profile: PlatformComplianceProfile) => Readonly<{
        caption: string;
        mediaKind: string;
        disclosures: readonly string[];
    }>;
}
export declare class SocialProviderRegistry {
    #private;
    register(provider: SocialProviderDefinition): SocialProviderDefinition;
    get(ownerId: string, id: string): SocialProviderDefinition | undefined;
    list(ownerId?: string): readonly SocialProviderDefinition[];
    supports(ownerId: string, id: string, capability: SocialProviderCapability): boolean;
}
export declare class PlatformAdapterRegistry {
    #private;
    register(adapter: PlatformTransformAdapter): PlatformTransformAdapter;
    requireExact(id: string, platform: string, version: number): PlatformTransformAdapter;
}
export declare class PlatformProfileRegistry {
    #private;
    constructor(adapters?: PlatformAdapterRegistry);
    register(input: PlatformComplianceProfile | LegacyPlatformComplianceProfile): PlatformComplianceProfile;
    get(ownerId: string, key: string): PlatformComplianceProfile;
    getExact(ownerId: string, key: string, version: number): PlatformComplianceProfile;
    list(ownerId?: string): readonly PlatformComplianceProfile[];
    private normalize;
}
export declare function transformForProfile(input: PlatformTransformInput, profile: PlatformComplianceProfile, adapters: PlatformAdapterRegistry): PlatformTransformResult;
export declare function createRuleDrivenPlatformAdapter(id: string, platform: string, version: number, implementationRef: string, sourceRefs: readonly string[]): PlatformTransformAdapter;
