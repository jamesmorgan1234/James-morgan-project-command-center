export type SocialPlatform = "instagram" | "tiktok" | "youtube" | "x" | "pinterest" | "linkedin" | "threads" | "snapchat" | "reddit" | "twitch" | "kick" | "discord" | "bluesky" | "mastodon" | "facebook" | "other";
export type SocialAccountKind = "personal" | "business" | "public";
export interface BrandAccountIdentity {
    readonly id: string;
    readonly ownerId: string;
    readonly entityId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly brandId: string;
    readonly platform: SocialPlatform;
    readonly externalAccountId: string;
    readonly displayName: string;
    readonly aliases: readonly string[];
    readonly accountKind?: SocialAccountKind;
    readonly sharedRelationshipRef?: string;
    readonly adAccountId?: string;
    readonly authorizationScopeRefs: readonly string[];
    readonly version: number;
}
export declare class BrandAccountRegistry {
    #private;
    register(input: BrandAccountIdentity): BrandAccountIdentity;
    get(id: string): BrandAccountIdentity | undefined;
    listForScope(ownerId: string, entityId: string, brandId: string, platform?: SocialPlatform, companyId?: string, projectId?: string): readonly BrandAccountIdentity[];
    requireExact(id: string, ownerId: string, brandId: string, platform: SocialPlatform): BrandAccountIdentity;
}
export interface SocialIdentityMapRecord {
    readonly id: string;
    readonly ownerId: string;
    readonly entityId: string;
    readonly companyId?: string;
    readonly brandId: string;
    readonly projectId?: string;
    readonly accountIdentityId: string;
    readonly platform: SocialPlatform;
    readonly platformIdentityId: string;
    readonly displayName: string;
    readonly aliases: readonly string[];
    readonly accountKind?: SocialAccountKind;
    readonly sharedRelationshipRef?: string;
    readonly adAccountId?: string;
    readonly ownershipRefs: readonly string[];
    readonly authorizationScopeRefs: readonly string[];
    readonly lineageRefs: readonly string[];
    readonly observedAt: string;
    readonly version: number;
}
export declare class SocialIdentityMapRegistry {
    #private;
    register(record: SocialIdentityMapRecord): SocialIdentityMapRecord;
    supersede(previousId: string, replacement: SocialIdentityMapRecord): SocialIdentityMapRecord;
    history(id: string, ownerId: string): readonly SocialIdentityMapRecord[];
    requireExact(id: string, ownerId: string, brandId: string, accountIdentityId: string, platform: SocialPlatform, platformIdentityId: string, scope?: {
        readonly companyId?: string;
        readonly projectId?: string;
        readonly entityId: string;
    }): SocialIdentityMapRecord;
}
