import { assertSecretChannelSafe } from "../security/secret-channels.js";

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "pinterest"
  | "linkedin"
  | "threads"
  | "snapchat"
  | "reddit"
  | "twitch"
  | "kick"
  | "discord"
  | "bluesky"
  | "mastodon"
  | "facebook"
  | "other";

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

const SOCIAL_PLATFORMS: readonly SocialPlatform[] = Object.freeze([
  "instagram", "tiktok", "youtube", "x", "pinterest", "linkedin", "threads",
  "snapchat", "reddit", "twitch", "kick", "discord", "bluesky", "mastodon",
  "facebook", "other"
]);

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${label} must contain nonblank references`);
  }
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

function optionalId(value: string | undefined, label: string): void {
  if (value !== undefined && !value.trim()) throw new Error(`${label} cannot be blank`);
}

function accountKey(account: Pick<BrandAccountIdentity, "ownerId" | "platform" | "externalAccountId">): string {
  return JSON.stringify([account.ownerId, account.platform, account.externalAccountId]);
}

function canonicalScopeKey(account: Pick<BrandAccountIdentity, "ownerId" | "entityId" | "companyId" | "projectId" | "brandId" | "platform">): string {
  return JSON.stringify([account.ownerId, account.entityId, account.companyId ?? null, account.projectId ?? null, account.brandId, account.platform]);
}

export class BrandAccountRegistry {
  readonly #byId = new Map<string, BrandAccountIdentity>();
  readonly #byExternal = new Map<string, string>();
  readonly #byScope = new Map<string, readonly string[]>();

  register(input: BrandAccountIdentity): BrandAccountIdentity {
    assertSecretChannelSafe("brain_memory", input);
    if (!SOCIAL_PLATFORMS.includes(input.platform)) throw new Error("Unknown social platform");
    if (!input.id.trim() || !input.ownerId.trim() || !input.entityId.trim() || !input.brandId.trim() || !input.externalAccountId.trim() || !input.displayName.trim()) {
      throw new Error("social account identity requires stable owner/entity/brand/platform/account identity");
    }
    optionalId(input.companyId, "companyId");
    optionalId(input.projectId, "projectId");
    optionalId(input.sharedRelationshipRef, "sharedRelationshipRef");
    optionalId(input.adAccountId, "adAccountId");
    if (!Number.isSafeInteger(input.version) || input.version < 1) throw new Error("social account identity version must be positive");
    if (input.accountKind && !["personal", "business", "public"].includes(input.accountKind)) throw new Error("Unknown social account kind");
    if (input.accountKind === "personal" && input.companyId) throw new Error("personal social accounts must remain distinct from company-owned business accounts");
    if (input.adAccountId && input.adAccountId === input.externalAccountId) throw new Error("ad account identity must remain separate from social profile identity");

    const aliases = refs(input.aliases, "social account aliases", false);
    const authorizationScopeRefs = refs(input.authorizationScopeRefs, "social authorization scopes");
    const externalKey = accountKey(input);
    const existingId = this.#byExternal.get(externalKey);
    if (existingId && existingId !== input.id) throw new Error("platform account is already bound to another canonical identity");

    const current = this.#byId.get(input.id);
    if (current) {
      if (input.version !== current.version + 1) throw new Error("social account identity version must advance exactly by one");
      const immutableChanged =
        current.ownerId !== input.ownerId ||
        current.entityId !== input.entityId ||
        current.companyId !== input.companyId ||
        current.projectId !== input.projectId ||
        current.brandId !== input.brandId ||
        current.platform !== input.platform ||
        current.externalAccountId !== input.externalAccountId ||
        current.accountKind !== input.accountKind;
      if (immutableChanged) throw new Error("canonical social account lineage cannot be silently substituted");
    } else if (input.version !== 1) {
      throw new Error("initial social account identity version must be one");
    }

    const frozen = Object.freeze({
      ...input,
      aliases: Object.freeze([...new Set([...(current?.aliases ?? []), ...(current && current.displayName !== input.displayName ? [current.displayName] : []), ...aliases])]),
      authorizationScopeRefs
    });
    this.#byId.set(input.id, frozen);
    this.#byExternal.set(externalKey, input.id);

    const scopeKey = canonicalScopeKey(input);
    const scopeIds = this.#byScope.get(scopeKey) ?? [];
    this.#byScope.set(scopeKey, Object.freeze([...new Set([...scopeIds, input.id])]));
    return frozen;
  }

  get(id: string): BrandAccountIdentity | undefined { return this.#byId.get(id); }

  listForScope(ownerId: string, entityId: string, brandId: string, platform?: SocialPlatform, companyId?: string, projectId?: string): readonly BrandAccountIdentity[] {
    const values = [...this.#byId.values()].filter((account) =>
      account.ownerId === ownerId &&
      account.entityId === entityId &&
      account.brandId === brandId &&
      account.companyId === companyId &&
      account.projectId === projectId &&
      (platform === undefined || account.platform === platform)
    );
    return Object.freeze(values);
  }

  requireExact(id: string, ownerId: string, brandId: string, platform: SocialPlatform): BrandAccountIdentity {
    const account = this.#byId.get(id);
    if (!account || account.ownerId !== ownerId || account.brandId !== brandId || account.platform !== platform) {
      throw new Error("exact social account identity mismatch");
    }
    return account;
  }
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

function platformIdentityKey(record: SocialIdentityMapRecord): string {
  return JSON.stringify([record.ownerId, record.platform, record.platformIdentityId]);
}

export class SocialIdentityMapRegistry {
  readonly #records = new Map<string, SocialIdentityMapRecord>();
  readonly #history = new Map<string, readonly SocialIdentityMapRecord[]>();
  readonly #platformIdentity = new Map<string, string>();
  readonly #accountIdentity = new Map<string, string>();

  register(record: SocialIdentityMapRecord): SocialIdentityMapRecord {
    assertSecretChannelSafe("brain_memory", record);
    if (!SOCIAL_PLATFORMS.includes(record.platform)) throw new Error("Unknown social platform");
    if (!record.id.trim() || !record.ownerId.trim() || !record.entityId.trim() || !record.brandId.trim() || !record.accountIdentityId.trim() || !record.platformIdentityId.trim() || !record.displayName.trim()) {
      throw new Error("social identity map requires explicit owner/entity/brand/account/platform identity");
    }
    optionalId(record.companyId, "companyId");
    optionalId(record.projectId, "projectId");
    optionalId(record.sharedRelationshipRef, "sharedRelationshipRef");
    optionalId(record.adAccountId, "adAccountId");
    if (record.accountKind === "personal" && record.companyId) throw new Error("personal and company social identities must remain distinct");
    if (record.adAccountId && record.adAccountId === record.platformIdentityId) throw new Error("ad account must remain separate from social profile");
    if (!Number.isSafeInteger(record.version) || record.version < 1) throw new Error("social identity map version must be positive");
    if (!Number.isFinite(Date.parse(record.observedAt))) throw new Error("social identity observedAt must be an ISO-compatible timestamp");

    const aliases = refs(record.aliases, "social identity aliases", false);
    const ownershipRefs = refs(record.ownershipRefs, "social identity ownership refs");
    const authorizationScopeRefs = refs(record.authorizationScopeRefs, "social identity authorization scopes");
    const lineageRefs = refs(record.lineageRefs, "social identity lineage refs");

    const externalKey = platformIdentityKey(record);
    const platformBound = this.#platformIdentity.get(externalKey);
    if (platformBound && platformBound !== record.id) throw new Error("platform identity is already bound to another canonical social identity");
    const accountKey = JSON.stringify([record.ownerId, record.accountIdentityId]);
    const accountBound = this.#accountIdentity.get(accountKey);
    if (accountBound && accountBound !== record.id) throw new Error("canonical social account is already bound to another identity map");

    const current = this.#records.get(record.id);
    if (current) {
      if (record.version !== current.version + 1) throw new Error("social identity map version must advance exactly by one");
      if (Date.parse(record.observedAt) < Date.parse(current.observedAt)) throw new Error("social identity observation time cannot move backward");
      const immutableChanged =
        current.ownerId !== record.ownerId || current.entityId !== record.entityId || current.companyId !== record.companyId ||
        current.brandId !== record.brandId || current.projectId !== record.projectId || current.accountIdentityId !== record.accountIdentityId ||
        current.platform !== record.platform || current.platformIdentityId !== record.platformIdentityId || current.accountKind !== record.accountKind;
      if (immutableChanged) throw new Error("canonical social identity lineage cannot be substituted");
    } else if (record.version !== 1) {
      throw new Error("initial social identity map version must be one");
    }

    const frozen = Object.freeze({
      ...record,
      aliases: Object.freeze([...new Set([...(current?.aliases ?? []), ...(current && current.displayName !== record.displayName ? [current.displayName] : []), ...aliases])]),
      ownershipRefs,
      authorizationScopeRefs,
      lineageRefs: Object.freeze([...new Set([...(current?.lineageRefs ?? []), ...lineageRefs])])
    });
    this.#records.set(record.id, frozen);
    this.#platformIdentity.set(externalKey, record.id);
    this.#accountIdentity.set(accountKey, record.id);
    this.#history.set(record.id, Object.freeze([...(this.#history.get(record.id) ?? []), frozen]));
    return frozen;
  }

  supersede(previousId: string, replacement: SocialIdentityMapRecord): SocialIdentityMapRecord {
    const previous = this.#records.get(previousId);
    if (!previous || previous.id === replacement.id) throw new Error("explicit social account replacement requires a distinct existing predecessor");
    if (previous.ownerId !== replacement.ownerId || previous.entityId !== replacement.entityId || previous.companyId !== replacement.companyId || previous.brandId !== replacement.brandId || previous.projectId !== replacement.projectId) {
      throw new Error("explicit social account replacement scope mismatch");
    }
    return this.register({ ...replacement, lineageRefs: [...replacement.lineageRefs, `supersedes:${previousId}`] });
  }

  history(id: string, ownerId: string): readonly SocialIdentityMapRecord[] {
    if (this.#records.get(id)?.ownerId !== ownerId) throw new Error("social identity history owner mismatch");
    return this.#history.get(id) ?? Object.freeze([]);
  }

  requireExact(id: string, ownerId: string, brandId: string, accountIdentityId: string, platform: SocialPlatform, platformIdentityId: string, scope?: { readonly companyId?: string; readonly projectId?: string; readonly entityId: string }): SocialIdentityMapRecord {
    const record = this.#records.get(id);
    if (!record || record.ownerId !== ownerId || record.brandId !== brandId || record.accountIdentityId !== accountIdentityId || record.platform !== platform || record.platformIdentityId !== platformIdentityId) {
      throw new Error("exact social identity lineage mismatch");
    }
    if (scope && (scope.entityId !== record.entityId || scope.companyId !== record.companyId || scope.projectId !== record.projectId)) {
      throw new Error("exact company/project/entity social scope mismatch");
    }
    return record;
  }
}
