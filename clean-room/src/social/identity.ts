export type SocialPlatform = "youtube" | "tiktok" | "instagram" | "facebook" | "pinterest" | "x" | "other";

export interface BrandAccountIdentity {
  readonly id: string;
  readonly ownerId: string;
  readonly entityId: string;
  readonly brandId: string;
  readonly platform: SocialPlatform;
  readonly externalAccountId: string;
  readonly displayName: string;
  readonly aliases: readonly string[];
  readonly authorizationScopeRefs: readonly string[];
  readonly version: number;
}

function key(account: BrandAccountIdentity): string { return `${account.platform}:${account.externalAccountId}`; }

export class BrandAccountRegistry {
  readonly #byId = new Map<string, BrandAccountIdentity>();
  readonly #byExternal = new Map<string, string>();
  register(account: BrandAccountIdentity): BrandAccountIdentity {
    if (!account.id.trim() || !account.ownerId.trim() || !account.entityId.trim() || !account.brandId.trim() || !account.externalAccountId.trim()) throw new Error("brand account identity requires stable owner/entity/brand/platform identifiers");
    if (account.authorizationScopeRefs.length === 0) throw new Error("brand account identity requires authorization scope evidence");
    const existingId = this.#byExternal.get(key(account));
    if (existingId && existingId !== account.id) throw new Error("external social account is already bound to another canonical identity");
    const current = this.#byId.get(account.id);
    if (current && (current.ownerId !== account.ownerId || current.entityId !== account.entityId || current.brandId !== account.brandId || current.platform !== account.platform || current.externalAccountId !== account.externalAccountId)) throw new Error("canonical social identity cannot be silently substituted");
    if (current && account.version <= current.version) throw new Error("social identity version must advance");
    const frozen = Object.freeze({ ...account, aliases: Object.freeze([...account.aliases]), authorizationScopeRefs: Object.freeze([...account.authorizationScopeRefs]) });
    this.#byId.set(account.id, frozen); this.#byExternal.set(key(account), account.id); return frozen;
  }
  requireExact(id: string, ownerId: string, brandId: string, platform: SocialPlatform): BrandAccountIdentity {
    const account = this.#byId.get(id); if (!account || account.ownerId !== ownerId || account.brandId !== brandId || account.platform !== platform) throw new Error("exact social account identity mismatch"); return account;
  }
}

export interface SocialIdentityMapRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly entityId: string;
  readonly companyId?: string | undefined;
  readonly brandId: string;
  readonly projectId?: string | undefined;
  readonly accountIdentityId: string;
  readonly platform: SocialPlatform;
  readonly platformIdentityId: string;
  readonly displayName: string;
  readonly aliases: readonly string[];
  readonly ownershipRefs: readonly string[];
  readonly authorizationScopeRefs: readonly string[];
  readonly lineageRefs: readonly string[];
  readonly observedAt: string;
  readonly version: number;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}
function platformKey(record: SocialIdentityMapRecord): string { return `${record.ownerId}:${record.platform}:${record.platformIdentityId}`; }

export class SocialIdentityMapRegistry {
  readonly #records = new Map<string, SocialIdentityMapRecord>();
  readonly #platformIdentity = new Map<string, string>();
  register(record: SocialIdentityMapRecord): SocialIdentityMapRecord {
    if (!record.id.trim() || !record.ownerId.trim() || !record.entityId.trim() || !record.brandId.trim() || !record.accountIdentityId.trim() || !record.platformIdentityId.trim() || !record.displayName.trim()) throw new Error("Social identity map requires explicit owner/entity/brand/account/platform identity");
    if (record.companyId !== undefined && !record.companyId.trim()) throw new Error("Social identity companyId cannot be blank");
    if (record.projectId !== undefined && !record.projectId.trim()) throw new Error("Social identity projectId cannot be blank");
    if (!Number.isSafeInteger(record.version) || record.version < 1) throw new Error("Social identity map version must be positive");
    if (!Number.isFinite(Date.parse(record.observedAt))) throw new Error("Social identity map observedAt must be an ISO-compatible timestamp");
    const ownershipRefs = refs(record.ownershipRefs, "Social identity ownership refs");
    const authorizationScopeRefs = refs(record.authorizationScopeRefs, "Social identity authorization scopes");
    const lineageRefs = refs(record.lineageRefs, "Social identity lineage refs");
    const aliases = refs(record.aliases, "Social identity aliases", false);
    const externalKey = platformKey(record);
    const bound = this.#platformIdentity.get(externalKey);
    if (bound && bound !== record.id) throw new Error("Platform identity is already bound to another canonical brand/account identity");
    const current = this.#records.get(record.id);
    if (current) {
      if (record.version <= current.version) throw new Error("Social identity map version must advance");
      if (current.ownerId !== record.ownerId || current.entityId !== record.entityId || current.companyId !== record.companyId || current.brandId !== record.brandId || current.projectId !== record.projectId || current.accountIdentityId !== record.accountIdentityId || current.platform !== record.platform || current.platformIdentityId !== record.platformIdentityId) throw new Error("Canonical social identity lineage cannot be substituted");
    }
    const frozen = Object.freeze({ ...record, aliases, ownershipRefs, authorizationScopeRefs, lineageRefs });
    this.#records.set(record.id, frozen); this.#platformIdentity.set(externalKey, record.id); return frozen;
  }
  requireExact(id: string, ownerId: string, brandId: string, accountIdentityId: string, platform: SocialPlatform, platformIdentityId: string): SocialIdentityMapRecord {
    const record = this.#records.get(id);
    if (!record || record.ownerId !== ownerId || record.brandId !== brandId || record.accountIdentityId !== accountIdentityId || record.platform !== platform || record.platformIdentityId !== platformIdentityId) throw new Error("Exact social identity lineage mismatch");
    return record;
  }
}
