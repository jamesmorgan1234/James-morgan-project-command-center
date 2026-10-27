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
  readonly transform: (input: PlatformTransformInput, profile: PlatformComplianceProfile) => Readonly<{ caption: string; mediaKind: string; disclosures: readonly string[] }>;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank values`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

function positiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
}

function timestamp(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} must be an ISO-compatible timestamp`);
}

function freezeConstraints(constraints: Readonly<Record<string, string | number | boolean>>): Readonly<Record<string, string | number | boolean>> {
  if (!constraints || typeof constraints !== "object" || Array.isArray(constraints)) throw new Error("provider constraints must be a record");
  const entries = Object.entries(constraints);
  for (const [key, value] of entries) {
    if (!key.trim()) throw new Error("provider constraint keys cannot be blank");
    if (!(typeof value === "string" || typeof value === "number" || typeof value === "boolean") || (typeof value === "number" && !Number.isFinite(value))) throw new Error("provider constraint values must be finite scalar values");
  }
  return Object.freeze(Object.fromEntries(entries));
}

function adapterVersionKey(id: string, version: number): string { return JSON.stringify([id,version]); }
function profileCurrentKey(ownerId: string, key: string): string { return JSON.stringify([ownerId,key]); }
function profileVersionKey(ownerId: string, key: string, version: number): string { return JSON.stringify([ownerId,key,version]); }

export class PlatformAdapterRegistry {
  readonly #current = new Map<string, PlatformTransformAdapter>();
  readonly #versions = new Map<string, PlatformTransformAdapter>();

  register(adapter: PlatformTransformAdapter): PlatformTransformAdapter {
    if (!adapter.id.trim() || !adapter.platform.trim() || !adapter.implementationRef.trim() || typeof adapter.transform !== "function") throw new Error("platform adapter identity, implementation, and transform are required");
    positiveInteger(adapter.version, "platform adapter version");
    const sourceRefs = refs(adapter.sourceRefs, "platform adapter source refs");
    const current = this.#current.get(adapter.id);
    if (current) {
      if (current.platform !== adapter.platform) throw new Error("platform adapter identity cannot switch platforms");
      if (adapter.version <= current.version) throw new Error("platform adapter version must advance");
    }
    const frozen = Object.freeze({ ...adapter, sourceRefs });
    this.#current.set(adapter.id, frozen);
    this.#versions.set(adapterVersionKey(adapter.id, adapter.version), frozen);
    return frozen;
  }

  requireExact(id: string, platform: string, version: number): PlatformTransformAdapter {
    const adapter = this.#versions.get(adapterVersionKey(id, version));
    if (!adapter || adapter.platform !== platform) throw new Error("exact platform adapter version is unavailable");
    return adapter;
  }
}

export class PlatformProfileRegistry {
  readonly #current = new Map<string, PlatformComplianceProfile>();
  readonly #versions = new Map<string, PlatformComplianceProfile>();
  readonly #adapters: PlatformAdapterRegistry;

  constructor(adapters?: PlatformAdapterRegistry) {
    this.#adapters = adapters ?? new PlatformAdapterRegistry();
  }

  register(input: PlatformComplianceProfile | LegacyPlatformComplianceProfile): PlatformComplianceProfile {
    const profile = this.normalize(input);
    if (!profile.key.trim() || !profile.ownerId.trim() || !profile.platform.trim() || !profile.adapterId.trim()) throw new Error("profile owner/identity/platform/adapter are required");
    positiveInteger(profile.version, "platform profile version");
    positiveInteger(profile.adapterVersion, "profile adapter version");
    positiveInteger(profile.maxCaptionChars, "profile caption limit");
    timestamp(profile.observedAt, "platform profile observedAt");
    if (profile.deprecatedAt) timestamp(profile.deprecatedAt,"profile deprecation");
    if (profile.publishScope !== undefined && !profile.publishScope.trim()) throw new Error("Profile publishing scope cannot be blank");
    if (profile.policyVersion !== undefined && !profile.policyVersion.trim()) throw new Error("Profile policy version cannot be blank");
    const allowedMediaKinds = refs(profile.allowedMediaKinds, "allowed media kinds");
    const requiredDisclosureTags = refs(profile.requiredDisclosureTags, "required disclosure tags", false);
    const sourceRefs = refs(profile.sourceRefs, "platform profile source refs");
    const providerConstraints = freezeConstraints(profile.providerConstraints);
    this.#adapters.requireExact(profile.adapterId, profile.platform, profile.adapterVersion);
    const currentKey = profileCurrentKey(profile.ownerId, profile.key);
    const current = this.#current.get(currentKey);
    if (current) {
      if (current.platform !== profile.platform || current.adapterId !== profile.adapterId) throw new Error("platform profile lineage cannot silently change platform/adapter identity");
      if (profile.version <= current.version) throw new Error("platform profile version must advance");
    }
    const frozen = Object.freeze({ ...profile, allowedMediaKinds, requiredDisclosureTags, sourceRefs, providerConstraints });
    this.#current.set(currentKey, frozen);
    this.#versions.set(profileVersionKey(profile.ownerId, profile.key, profile.version), frozen);
    return frozen;
  }

  get(ownerId: string, key: string): PlatformComplianceProfile {
    const profile = this.#current.get(profileCurrentKey(ownerId, key));
    if (!profile) throw new Error(`unknown platform profile: ${key}`);
    return profile;
  }

  getExact(ownerId: string, key: string, version: number): PlatformComplianceProfile {
    const profile = this.#versions.get(profileVersionKey(ownerId, key, version));
    if (!profile) throw new Error("exact platform profile version is unavailable");
    return profile;
  }

  list(ownerId?: string): readonly PlatformComplianceProfile[] {
    const profiles = [...this.#current.values()];
    return Object.freeze(ownerId === undefined ? profiles : profiles.filter((profile) => profile.ownerId === ownerId));
  }

  private normalize(input: PlatformComplianceProfile | LegacyPlatformComplianceProfile): PlatformComplianceProfile {
    if ("ownerId" in input) return input;
    if (!input.sourceRef.trim()) throw new Error("legacy platform profile requires provenance");
    const adapterId = `legacy-rule-driven:${input.platform}`;
    try {
      this.#adapters.requireExact(adapterId, input.platform, input.version);
    } catch {
      this.#adapters.register(createRuleDrivenPlatformAdapter(adapterId, input.platform, input.version, `legacy-compatible:${input.platform}:v${input.version}`, [input.sourceRef]));
    }
    return Object.freeze({
      key: input.key,
      ownerId: "legacy-unscoped",
      platform: input.platform,
      version: input.version,
      adapterId,
      adapterVersion: input.version,
      maxCaptionChars: input.maxCaptionChars,
      allowedMediaKinds: Object.freeze([...input.allowedMediaKinds]),
      requiredDisclosureTags: Object.freeze([...input.requiredDisclosureTags]),
      providerConstraints: Object.freeze({}),
      sourceRefs: Object.freeze([input.sourceRef]),
      observedAt: "1970-01-01T00:00:00.000Z"
    });
  }
}

export function transformForProfile(input: PlatformTransformInput, profile: PlatformComplianceProfile, adapters: PlatformAdapterRegistry): PlatformTransformResult {
  if (profile.deprecatedAt && (input.now === undefined || !Number.isFinite(Date.parse(input.now)) || Date.parse(input.now)>=Date.parse(profile.deprecatedAt))) throw new Error("Platform profile is deprecated or current policy time unverified");
  if (!profile.allowedMediaKinds.includes(input.mediaKind)) throw new Error("media kind is not allowed by current platform profile");
  const adapter = adapters.requireExact(profile.adapterId, profile.platform, profile.adapterVersion);
  const transformed = adapter.transform(Object.freeze({ ...input, disclosures: Object.freeze([...input.disclosures]) }), profile);
  if (!transformed || typeof transformed.caption !== "string" || transformed.mediaKind !== input.mediaKind || !Array.isArray(transformed.disclosures)) throw new Error("platform adapter returned malformed transformation output");
  if (transformed.caption.length > profile.maxCaptionChars) throw new Error("platform adapter output violates profile caption limit");
  const disclosures = refs(transformed.disclosures, "transformed disclosures", false);
  for (const required of profile.requiredDisclosureTags) if (!disclosures.includes(required)) throw new Error("platform adapter output is missing required disclosure");
  return Object.freeze({ caption: transformed.caption, mediaKind: transformed.mediaKind, disclosures, profileKey: profile.key, profileVersion: profile.version, adapterId: adapter.id, adapterVersion: adapter.version });
}

export function createRuleDrivenPlatformAdapter(id: string, platform: string, version: number, implementationRef: string, sourceRefs: readonly string[]): PlatformTransformAdapter {
  return Object.freeze({
    id, platform, version, implementationRef, sourceRefs: Object.freeze([...sourceRefs]),
    transform(input: PlatformTransformInput, profile: PlatformComplianceProfile) {
      const supported = new Set(["maxMediaCount","minWidth","maxWidth","minHeight","maxHeight","minAspectRatio","maxAspectRatio","maxDurationSeconds","maxLinks","maxHashtags","schedulingSupported","publishingSupported","maxScheduleAheadSeconds","requiresRightsEvidence"]);
      for (const key of Object.keys(profile.providerConstraints)) if (!supported.has(key)) throw new Error(`Unsupported provider constraint requires a capable versioned adapter: ${key}`);
      const c=profile.providerConstraints,m=input.metadata??{};
      for (const key of ["schedulingSupported","publishingSupported","requiresRightsEvidence"]) if (c[key]!==undefined && typeof c[key]!=="boolean") throw new Error("Provider capability rule must be boolean");
      if (c.publishingSupported===false) throw new Error("Profile does not permit publishing");
      if (c.requiresRightsEvidence===true && (!input.rightsEvidenceRefs?.length || input.rightsEvidenceRefs.some(r=>!r.trim()))) throw new Error("Profile requires rights evidence");
      const measurements:Record<string,unknown>={mediaCount:m.mediaCount??1,width:m.width,height:m.height,durationSeconds:m.durationSeconds,links:(input.caption.match(/https?:\/\//g)??[]).length,hashtags:(input.caption.match(/#[\p{L}\p{N}_]+/gu)??[]).length};
      if(typeof m.width==="number" && typeof m.height==="number" && m.height>0) measurements.aspectRatio=m.width/m.height;
      for (const [key,field,minimum] of [["maxMediaCount","mediaCount",false],["minWidth","width",true],["maxWidth","width",false],["minHeight","height",true],["maxHeight","height",false],["minAspectRatio","aspectRatio",true],["maxAspectRatio","aspectRatio",false],["maxDurationSeconds","durationSeconds",false],["maxLinks","links",false],["maxHashtags","hashtags",false]] as const) {
       const limit=c[key]; if(limit===undefined)continue;
       const value=measurements[field];
       if(typeof limit!=="number" || !Number.isFinite(limit) || limit<0 || typeof value!=="number" || !Number.isFinite(value) || value<0 || (minimum?value<limit:value>limit)) throw new Error(`Platform constraint failed or measurement missing: ${key}`);
      }
      if(m.scheduledAt!==undefined){
       if(c.schedulingSupported!==true || typeof m.scheduledAt!=="string" || !input.now) throw new Error("Scheduling unsupported or clock missing");
       const delay=Date.parse(m.scheduledAt)-Date.parse(input.now);
       if(!Number.isFinite(delay)||delay<0 || (c.maxScheduleAheadSeconds!==undefined && (typeof c.maxScheduleAheadSeconds!=="number" || !Number.isFinite(c.maxScheduleAheadSeconds) || c.maxScheduleAheadSeconds<0 || delay>c.maxScheduleAheadSeconds*1000)))throw new Error("Schedule violates platform policy");
      }
      const disclosureSet = new Set<string>(input.disclosures);
      for (const required of profile.requiredDisclosureTags) disclosureSet.add(required);
      const caption = input.caption.length > profile.maxCaptionChars ? input.caption.slice(0, profile.maxCaptionChars) : input.caption;
      return Object.freeze({ caption, mediaKind: input.mediaKind, disclosures: Object.freeze([...disclosureSet]) });
    }
  });
}
