import { assertSecretChannelSafe } from "../security/secret-channels.js";
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
    assertSecretChannelSafe("brain_memory", account);
    if (!Number.isSafeInteger(account.version) || account.version < 1 || !["youtube","tiktok","instagram","facebook","pinterest","x","other"].includes(account.platform)) throw new Error("Invalid social account platform/version");
    refs(account.aliases,"Social account aliases",false); refs(account.authorizationScopeRefs,"Social account authorization scopes");
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
function platformKey(record: SocialIdentityMapRecord): string { return JSON.stringify([record.ownerId,record.platform,record.platformIdentityId]); }

export class SocialIdentityMapRegistry {
  readonly #records = new Map<string, SocialIdentityMapRecord>();
  readonly #history = new Map<string, readonly SocialIdentityMapRecord[]>();
  readonly #accountIdentity = new Map<string, string>();
  readonly #platformIdentity = new Map<string, string>();
  register(record: SocialIdentityMapRecord): SocialIdentityMapRecord {
    assertSecretChannelSafe("brain_memory", record);
    if (!["youtube","tiktok","instagram","facebook","pinterest","x","other"].includes(record.platform)) throw new Error("Unknown social platform");
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
    const accountKey = JSON.stringify([record.ownerId,record.accountIdentityId]);
    if (this.#accountIdentity.has(accountKey) && this.#accountIdentity.get(accountKey) !== record.id) throw new Error("Canonical account is already bound to another identity map");
    const current = this.#records.get(record.id);
    if (current) {
      if (Date.parse(record.observedAt) < Date.parse(current.observedAt)) throw new Error("Identity observation time cannot move backward");
      if (record.version !== current.version + 1) throw new Error("Social identity map version must advance");
      if (current.ownerId !== record.ownerId || current.entityId !== record.entityId || current.companyId !== record.companyId || current.brandId !== record.brandId || current.projectId !== record.projectId || current.accountIdentityId !== record.accountIdentityId || current.platform !== record.platform || current.platformIdentityId !== record.platformIdentityId) throw new Error("Canonical social identity lineage cannot be substituted");
    }
    if (!current && record.version !== 1) throw new Error("Initial social identity version must be one");
    const frozen = Object.freeze({ ...record,
      aliases: Object.freeze([...new Set([...(current?.aliases ?? []), ...(current && current.displayName !== record.displayName ? [current.displayName] : []), ...aliases])]),
      ownershipRefs, authorizationScopeRefs,
      lineageRefs: Object.freeze([...new Set([...(current?.lineageRefs ?? []), ...lineageRefs])]) });
    this.#records.set(record.id, frozen); this.#platformIdentity.set(externalKey, record.id); this.#accountIdentity.set(accountKey,record.id);
    this.#history.set(record.id,Object.freeze([...(this.#history.get(record.id) ?? []),frozen])); return frozen;
  }
  supersede(previousId: string, replacement: SocialIdentityMapRecord): SocialIdentityMapRecord {
    const previous = this.#records.get(previousId);
    if (!previous || replacement.id === previous.id || previous.ownerId !== replacement.ownerId || previous.entityId !== replacement.entityId || previous.companyId !== replacement.companyId || previous.brandId !== replacement.brandId || previous.projectId !== replacement.projectId) throw new Error("Explicit account replacement scope mismatch");
    return this.register({...replacement,lineageRefs:[...replacement.lineageRefs,`supersedes:${previousId}`]});
  }
  history(id: string, ownerId: string): readonly SocialIdentityMapRecord[] {
    if (this.#records.get(id)?.ownerId !== ownerId) throw new Error("Identity history owner mismatch");
    return this.#history.get(id)!;
  }
  requireExact(id: string, ownerId: string, brandId: string, accountIdentityId: string, platform: SocialPlatform, platformIdentityId: string, scope?: {readonly companyId?: string; readonly projectId?: string; readonly entityId: string}): SocialIdentityMapRecord {
    const record = this.#records.get(id);
    if (!record || record.ownerId !== ownerId || record.brandId !== brandId || record.accountIdentityId !== accountIdentityId || record.platform !== platform || record.platformIdentityId !== platformIdentityId) throw new Error("Exact social identity lineage mismatch");
    if (scope && (scope.companyId !== record.companyId || scope.projectId !== record.projectId || scope.entityId !== record.entityId)) throw new Error("Exact company/project/entity scope mismatch");
    return record;
  }
}
