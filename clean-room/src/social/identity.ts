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

function key(account: BrandAccountIdentity): string {
  return `${account.platform}:${account.externalAccountId}`;
}

export class BrandAccountRegistry {
  readonly #byId = new Map<string, BrandAccountIdentity>();
  readonly #byExternal = new Map<string, string>();

  register(account: BrandAccountIdentity): BrandAccountIdentity {
    if (!account.id.trim() || !account.ownerId.trim() || !account.entityId.trim() || !account.brandId.trim() || !account.externalAccountId.trim()) {
      throw new Error("brand account identity requires stable owner/entity/brand/platform identifiers");
    }
    if (account.authorizationScopeRefs.length === 0) throw new Error("brand account identity requires authorization scope evidence");
    const existingId = this.#byExternal.get(key(account));
    if (existingId && existingId !== account.id) throw new Error("external social account is already bound to another canonical identity");
    const current = this.#byId.get(account.id);
    if (current && (current.ownerId !== account.ownerId || current.entityId !== account.entityId || current.brandId !== account.brandId || current.platform !== account.platform || current.externalAccountId !== account.externalAccountId)) {
      throw new Error("canonical social identity cannot be silently substituted");
    }
    if (current && account.version <= current.version) throw new Error("social identity version must advance");
    const frozen = Object.freeze({ ...account, aliases: Object.freeze([...account.aliases]), authorizationScopeRefs: Object.freeze([...account.authorizationScopeRefs]) });
    this.#byId.set(account.id, frozen);
    this.#byExternal.set(key(account), account.id);
    return frozen;
  }

  requireExact(id: string, ownerId: string, brandId: string, platform: SocialPlatform): BrandAccountIdentity {
    const account = this.#byId.get(id);
    if (!account || account.ownerId !== ownerId || account.brandId !== brandId || account.platform !== platform) throw new Error("exact social account identity mismatch");
    return account;
  }
}
