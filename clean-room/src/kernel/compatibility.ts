export interface ApiVersionRange {
  readonly min: number;
  readonly max: number;
}

export interface ApiSemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export interface ApiDeprecationNotice {
  readonly apiVersion: number;
  readonly deprecatedSince: ApiSemanticVersion;
  readonly sunsetAfter: string;
  readonly replacement: string;
  readonly warning: string;
}

export interface CompatibilityHello {
  readonly apiVersion: number;
  readonly schemaVersion: number;
  readonly capabilities: readonly string[];
  readonly acceptsUnknownFields: boolean;
}

export interface ServerCompatibilityHello extends CompatibilityHello {
  readonly supportedClientApi: ApiVersionRange;
}

export interface CompatibilityNegotiation {
  readonly accepted: boolean;
  readonly negotiatedApiVersion: number | null;
  readonly negotiatedSchemaVersion: number | null;
  readonly sharedCapabilities: readonly string[];
  readonly unsupportedClientCapabilities: readonly string[];
  readonly reason: string | null;
}

export interface ParsedCompatibilityEnvelope {
  readonly apiVersion: number;
  readonly schemaVersion: number;
  readonly capabilities: readonly string[];
  readonly acceptsUnknownFields: boolean;
  readonly unknownFields: readonly string[];
}

export interface ApiContractSnapshot {
  readonly version: ApiSemanticVersion;
  readonly capabilities: readonly string[];
  readonly deprecatedCapabilities: readonly string[];
}

export type ApiChangeLevel = "patch" | "minor" | "major";

export interface ApiChangeImpactReport {
  readonly level: ApiChangeLevel;
  readonly previousVersion: string;
  readonly nextVersion: string;
  readonly addedCapabilities: readonly string[];
  readonly removedCapabilities: readonly string[];
  readonly newlyDeprecatedCapabilities: readonly string[];
  readonly breaking: boolean;
  readonly summary: string;
}

export interface ApiChangelogEntry {
  readonly version: ApiSemanticVersion;
  readonly level: ApiChangeLevel;
  readonly summary: string;
  readonly deprecatedCapabilities: readonly string[];
}

const HELLO_FIELDS = new Set(["apiVersion", "schemaVersion", "capabilities", "acceptsUnknownFields"]);

function assertPositiveInteger(value: unknown, label: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) throw new Error(`${label} must be a positive safe integer`);
}

function assertRange(range: ApiVersionRange, label: string): void {
  assertPositiveInteger(range?.min, `${label}.min`);
  assertPositiveInteger(range?.max, `${label}.max`);
  if (range.max < range.min) throw new Error(`${label}.max must be greater than or equal to ${label}.min`);
}

function normalizeCapabilities(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values)) throw new Error(`${label} must be an array`);
  const normalized = values.map((value) => {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${label} entries must be nonblank strings`);
    return value.trim();
  });
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} entries must be unique`);
  return Object.freeze(normalized);
}

function validateHello(hello: CompatibilityHello, label: string): CompatibilityHello {
  if (!hello || typeof hello !== "object") throw new Error(`${label} is required`);
  assertPositiveInteger(hello.apiVersion, `${label}.apiVersion`);
  assertPositiveInteger(hello.schemaVersion, `${label}.schemaVersion`);
  if (typeof hello.acceptsUnknownFields !== "boolean") throw new Error(`${label}.acceptsUnknownFields must be boolean`);
  return Object.freeze({
    apiVersion: hello.apiVersion,
    schemaVersion: hello.schemaVersion,
    capabilities: normalizeCapabilities(hello.capabilities, `${label}.capabilities`),
    acceptsUnknownFields: hello.acceptsUnknownFields
  });
}

function compareSemanticVersion(left: ApiSemanticVersion, right: ApiSemanticVersion): number {
  for (const key of ["major", "minor", "patch"] as const) {
    const delta = left[key] - right[key];
    if (delta !== 0) return Math.sign(delta);
  }
  return 0;
}

export function validateApiSemanticVersion(version: ApiSemanticVersion): ApiSemanticVersion {
  if (!version || typeof version !== "object") throw new Error("API semantic version is required");
  for (const key of ["major", "minor", "patch"] as const) {
    if (!Number.isSafeInteger(version[key]) || version[key] < 0) throw new Error(`API semantic version ${key} must be a nonnegative safe integer`);
  }
  if (version.major < 1) throw new Error("API semantic version major must be at least 1");
  return Object.freeze({ major: version.major, minor: version.minor, patch: version.patch });
}

export function formatApiSemanticVersion(version: ApiSemanticVersion): string {
  const valid = validateApiSemanticVersion(version);
  return `${valid.major}.${valid.minor}.${valid.patch}`;
}

export function classifyApiVersionChange(previous: ApiSemanticVersion, next: ApiSemanticVersion): ApiChangeLevel {
  const before = validateApiSemanticVersion(previous);
  const after = validateApiSemanticVersion(next);
  if (compareSemanticVersion(after, before) <= 0) throw new Error("Next API semantic version must be newer than previous version");
  if (after.major !== before.major) return "major";
  if (after.minor !== before.minor) return "minor";
  return "patch";
}

export function buildApiDeprecationMetadata(notice: ApiDeprecationNotice): Readonly<Record<string, string>> {
  assertPositiveInteger(notice?.apiVersion, "apiVersion");
  const since = formatApiSemanticVersion(notice.deprecatedSince);
  if (typeof notice.sunsetAfter !== "string" || !notice.sunsetAfter.trim() || Number.isNaN(Date.parse(notice.sunsetAfter))) throw new Error("sunsetAfter must be a valid date/time string");
  if (typeof notice.replacement !== "string" || !notice.replacement.trim()) throw new Error("replacement is required");
  if (typeof notice.warning !== "string" || !notice.warning.trim()) throw new Error("warning is required");
  return Object.freeze({
    Deprecation: "true",
    Sunset: new Date(notice.sunsetAfter).toUTCString(),
    Link: `<${notice.replacement.trim()}>; rel="successor-version"`,
    "X-Command-Center-API-Version": String(notice.apiVersion),
    "X-Command-Center-Deprecated-Since": since,
    Warning: notice.warning.trim()
  });
}

export function negotiateCompatibility(clientInput: CompatibilityHello, serverInput: ServerCompatibilityHello): CompatibilityNegotiation {
  const client = validateHello(clientInput, "client");
  const server = validateHello(serverInput, "server");
  assertRange(serverInput.supportedClientApi, "server.supportedClientApi");
  const sharedCapabilities = Object.freeze(client.capabilities.filter((capability) => server.capabilities.includes(capability)));
  const unsupportedClientCapabilities = Object.freeze(client.capabilities.filter((capability) => !server.capabilities.includes(capability)));
  if (client.apiVersion < serverInput.supportedClientApi.min || client.apiVersion > serverInput.supportedClientApi.max) {
    return Object.freeze({
      accepted: false,
      negotiatedApiVersion: null,
      negotiatedSchemaVersion: null,
      sharedCapabilities,
      unsupportedClientCapabilities,
      reason: `Client API version ${client.apiVersion} is outside supported range ${serverInput.supportedClientApi.min}-${serverInput.supportedClientApi.max}`
    });
  }
  if (client.schemaVersion !== server.schemaVersion) {
    return Object.freeze({
      accepted: false,
      negotiatedApiVersion: null,
      negotiatedSchemaVersion: null,
      sharedCapabilities,
      unsupportedClientCapabilities,
      reason: `Schema version mismatch: client ${client.schemaVersion}, server ${server.schemaVersion}`
    });
  }
  return Object.freeze({
    accepted: true,
    negotiatedApiVersion: Math.min(client.apiVersion, server.apiVersion),
    negotiatedSchemaVersion: client.schemaVersion,
    sharedCapabilities,
    unsupportedClientCapabilities,
    reason: null
  });
}

export function negotiateClientCapabilities(client: CompatibilityHello, server: ServerCompatibilityHello): CompatibilityNegotiation {
  return negotiateCompatibility(client, server);
}

export function negotiateServerCapabilities(server: ServerCompatibilityHello, client: CompatibilityHello): CompatibilityNegotiation {
  return negotiateCompatibility(client, server);
}

export function resolveUnsupportedFeature(feature: string, negotiation: CompatibilityNegotiation): Readonly<{ supported: boolean; reason: string | null }> {
  if (typeof feature !== "string" || !feature.trim()) throw new Error("Feature name is required");
  if (!negotiation.accepted) return Object.freeze({ supported: false, reason: negotiation.reason ?? "Compatibility negotiation was refused" });
  if (!negotiation.sharedCapabilities.includes(feature.trim())) {
    return Object.freeze({ supported: false, reason: `Unsupported capability: ${feature.trim()}` });
  }
  return Object.freeze({ supported: true, reason: null });
}

export function assertBackendClientCompatibility(negotiation: CompatibilityNegotiation): void {
  if (!negotiation.accepted) throw new Error(`Unsafe incompatible client refused: ${negotiation.reason ?? "compatibility negotiation failed"}`);
}

export function readCompatibilityEnvelope(input: unknown): ParsedCompatibilityEnvelope {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Compatibility envelope must be an object");
  const record = input as Record<string, unknown>;
  const hello = validateHello({
    apiVersion: record.apiVersion as number,
    schemaVersion: record.schemaVersion as number,
    capabilities: record.capabilities as readonly string[],
    acceptsUnknownFields: record.acceptsUnknownFields as boolean
  }, "compatibility envelope");
  const unknownFields = Object.freeze(Object.keys(record).filter((key) => !HELLO_FIELDS.has(key)).sort());
  return Object.freeze({ ...hello, unknownFields });
}

export function writeCompatibilityEnvelope(input: CompatibilityHello & Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Compatibility envelope must be an object");
  const unknownFields = Object.keys(input).filter((key) => !HELLO_FIELDS.has(key));
  if (unknownFields.length > 0) throw new Error(`Write contract contains unknown fields: ${unknownFields.sort().join(", ")}`);
  const hello = validateHello(input, "compatibility envelope");
  return Object.freeze({
    apiVersion: hello.apiVersion,
    schemaVersion: hello.schemaVersion,
    capabilities: hello.capabilities,
    acceptsUnknownFields: hello.acceptsUnknownFields
  });
}

export function assessApiChange(previousInput: ApiContractSnapshot, nextInput: ApiContractSnapshot): ApiChangeImpactReport {
  const previousVersion = validateApiSemanticVersion(previousInput.version);
  const nextVersion = validateApiSemanticVersion(nextInput.version);
  const declaredLevel = classifyApiVersionChange(previousVersion, nextVersion);
  const previousCapabilities = normalizeCapabilities(previousInput.capabilities, "previous.capabilities");
  const nextCapabilities = normalizeCapabilities(nextInput.capabilities, "next.capabilities");
  const previousDeprecated = normalizeCapabilities(previousInput.deprecatedCapabilities, "previous.deprecatedCapabilities");
  const nextDeprecated = normalizeCapabilities(nextInput.deprecatedCapabilities, "next.deprecatedCapabilities");
  const addedCapabilities = Object.freeze(nextCapabilities.filter((item) => !previousCapabilities.includes(item)));
  const removedCapabilities = Object.freeze(previousCapabilities.filter((item) => !nextCapabilities.includes(item)));
  const newlyDeprecatedCapabilities = Object.freeze(nextDeprecated.filter((item) => !previousDeprecated.includes(item)));
  const requiredLevel: ApiChangeLevel = removedCapabilities.length > 0 ? "major" : addedCapabilities.length > 0 || newlyDeprecatedCapabilities.length > 0 ? "minor" : "patch";
  const rank: Record<ApiChangeLevel, number> = { patch: 0, minor: 1, major: 2 };
  if (rank[declaredLevel] < rank[requiredLevel]) {
    throw new Error(`API semantic version change ${declaredLevel} is insufficient for ${requiredLevel} impact`);
  }
  return Object.freeze({
    level: declaredLevel,
    previousVersion: formatApiSemanticVersion(previousVersion),
    nextVersion: formatApiSemanticVersion(nextVersion),
    addedCapabilities,
    removedCapabilities,
    newlyDeprecatedCapabilities,
    breaking: removedCapabilities.length > 0,
    summary: `API ${formatApiSemanticVersion(previousVersion)} -> ${formatApiSemanticVersion(nextVersion)}: ${addedCapabilities.length} added, ${removedCapabilities.length} removed, ${newlyDeprecatedCapabilities.length} newly deprecated`
  });
}

export function validateApiChangelog(entries: readonly ApiChangelogEntry[]): readonly ApiChangelogEntry[] {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error("API changelog must contain at least one entry");
  const normalized = entries.map((entry, index) => {
    const version = validateApiSemanticVersion(entry.version);
    if (!["patch", "minor", "major"].includes(entry.level)) throw new Error(`API changelog entry ${index} has invalid change level`);
    if (typeof entry.summary !== "string" || !entry.summary.trim()) throw new Error(`API changelog entry ${index} requires a summary`);
    return Object.freeze({
      version,
      level: entry.level,
      summary: entry.summary.trim(),
      deprecatedCapabilities: normalizeCapabilities(entry.deprecatedCapabilities, `changelog[${index}].deprecatedCapabilities`)
    });
  });
  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    if (!previous || !current || compareSemanticVersion(current.version, previous.version) <= 0) {
      throw new Error("API changelog entries must be strictly increasing by semantic version");
    }
  }
  return Object.freeze(normalized);
}
