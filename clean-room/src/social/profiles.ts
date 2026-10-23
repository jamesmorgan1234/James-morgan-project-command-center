export interface PlatformComplianceProfile {
  readonly key: string;
  readonly platform: string;
  readonly version: number;
  readonly maxCaptionChars: number;
  readonly allowedMediaKinds: readonly string[];
  readonly requiredDisclosureTags: readonly string[];
  readonly sourceRef: string;
}

export class PlatformProfileRegistry {
  readonly #profiles = new Map<string, PlatformComplianceProfile>();

  register(profile: PlatformComplianceProfile): PlatformComplianceProfile {
    if (!profile.key.trim() || !profile.platform.trim() || !profile.sourceRef.trim()) throw new Error("profile identity and provenance are required");
    if (profile.version < 1 || profile.maxCaptionChars < 1) throw new Error("invalid platform profile version or caption limit");
    const current = this.#profiles.get(profile.key);
    if (current && profile.version <= current.version) throw new Error("platform profile version must advance");
    const frozen = Object.freeze({ ...profile, allowedMediaKinds: Object.freeze([...profile.allowedMediaKinds]), requiredDisclosureTags: Object.freeze([...profile.requiredDisclosureTags]) });
    this.#profiles.set(profile.key, frozen);
    return frozen;
  }

  get(key: string): PlatformComplianceProfile {
    const profile = this.#profiles.get(key);
    if (!profile) throw new Error(`unknown platform profile: ${key}`);
    return profile;
  }

  list(): readonly PlatformComplianceProfile[] { return Object.freeze([...this.#profiles.values()]); }
}

export function transformForProfile(input: { caption: string; mediaKind: string; disclosures: readonly string[] }, profile: PlatformComplianceProfile): Readonly<{ caption: string; mediaKind: string; disclosures: readonly string[] }> {
  if (!profile.allowedMediaKinds.includes(input.mediaKind)) throw new Error("media kind is not allowed by current platform profile");
  const disclosureSet = new Set(input.disclosures);
  for (const required of profile.requiredDisclosureTags) disclosureSet.add(required);
  const caption = input.caption.length > profile.maxCaptionChars ? input.caption.slice(0, profile.maxCaptionChars) : input.caption;
  return Object.freeze({ caption, mediaKind: input.mediaKind, disclosures: Object.freeze([...disclosureSet]) });
}
