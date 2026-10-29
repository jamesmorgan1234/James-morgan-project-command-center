import {
  CURRENT_RUNTIME_API_VERSION,
  SUPPORTED_RUNTIME_API_RANGE,
  type VersionRange
} from "../kernel/config.js";

export type ApiContractMethod = "GET" | "POST";
export type ApiContractPagination = "none";
export type ApiContractCorrelation = "none";
export type ApiContractRetryPolicy = "none";
export type ApiContractInfrastructurePolicy = "provider-managed" | "not-applicable";
export type ApiContractAccess = "runtime-read" | "session-control";

export interface FirstPartyApiContract {
  readonly key: string;
  readonly version: number;
  readonly owner: string;
  readonly binding: string;
  readonly methods: readonly ApiContractMethod[];
  readonly access: ApiContractAccess;
  readonly requestSchema: string;
  readonly responseSchema: string;
  readonly errorEnvelope: string;
  readonly compatibleApi: Readonly<VersionRange>;
  readonly pagination: ApiContractPagination;
  readonly correlation: ApiContractCorrelation;
  readonly timeoutMs: number;
  readonly retryPolicy: ApiContractRetryPolicy;
  readonly rateLimitApplicability: ApiContractInfrastructurePolicy;
  readonly circuitBreakerApplicability: ApiContractInfrastructurePolicy;
  readonly capabilities: readonly string[];
  readonly metadata: readonly string[];
}

function requireNonblank(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be nonblank`);
  if (value !== value.trim()) throw new Error(`${label} must not contain surrounding whitespace`);
  return value;
}

function requireUniqueNonblank(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values)) throw new Error(`${label} must be an array`);
  const normalized = values.map((value, index) => requireNonblank(value, `${label}[${index}]`));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} must not contain duplicates`);
  return Object.freeze(normalized);
}

function validateCompatibleApi(range: Readonly<VersionRange>, version: number): Readonly<VersionRange> {
  if (!range || !Number.isSafeInteger(range.min) || !Number.isSafeInteger(range.max) || range.min < 1 || range.max < range.min) {
    throw new Error("compatibleApi must be a valid positive version range");
  }
  if (version < range.min || version > range.max) throw new Error("Contract version is outside compatibleApi range");
  if (range.min < SUPPORTED_RUNTIME_API_RANGE.min || range.max > SUPPORTED_RUNTIME_API_RANGE.max) {
    throw new Error(`Contract compatibleApi range must remain within supported runtime API range ${SUPPORTED_RUNTIME_API_RANGE.min}-${SUPPORTED_RUNTIME_API_RANGE.max}`);
  }
  return Object.freeze({ min: range.min, max: range.max });
}

export function validateFirstPartyApiContract(contract: FirstPartyApiContract): FirstPartyApiContract {
  if (!contract || typeof contract !== "object") throw new Error("API contract is required");
  const key = requireNonblank(contract.key, "key");
  const owner = requireNonblank(contract.owner, "owner");
  const binding = requireNonblank(contract.binding, "binding");
  const requestSchema = requireNonblank(contract.requestSchema, "requestSchema");
  const responseSchema = requireNonblank(contract.responseSchema, "responseSchema");
  const errorEnvelope = requireNonblank(contract.errorEnvelope, "errorEnvelope");
  if (!Number.isSafeInteger(contract.version) || contract.version < 1) throw new Error("version must be a positive safe integer");
  if (contract.version < SUPPORTED_RUNTIME_API_RANGE.min || contract.version > SUPPORTED_RUNTIME_API_RANGE.max) {
    throw new Error(`Unsupported API contract version ${contract.version}; supported range is ${SUPPORTED_RUNTIME_API_RANGE.min}-${SUPPORTED_RUNTIME_API_RANGE.max}`);
  }
  if (!Array.isArray(contract.methods) || contract.methods.length === 0) throw new Error("methods must contain at least one method");
  const methods = requireUniqueNonblank(contract.methods, "methods") as readonly ApiContractMethod[];
  for (const method of methods) {
    if (method !== "GET" && method !== "POST") throw new Error(`Unsupported API contract method ${method}`);
  }
  if (contract.access !== "runtime-read" && contract.access !== "session-control") throw new Error(`Unsupported API access ${String(contract.access)}`);
  if (contract.pagination !== "none") throw new Error(`Unsupported pagination policy ${String(contract.pagination)}`);
  if (contract.correlation !== "none") throw new Error(`Unsupported correlation policy ${String(contract.correlation)}`);
  if (contract.retryPolicy !== "none") throw new Error(`Unsupported retry policy ${String(contract.retryPolicy)}`);
  for (const [label, value] of [
    ["rateLimitApplicability", contract.rateLimitApplicability],
    ["circuitBreakerApplicability", contract.circuitBreakerApplicability]
  ] as const) {
    if (value !== "provider-managed" && value !== "not-applicable") throw new Error(`Unsupported ${label} ${String(value)}`);
  }
  if (!Number.isSafeInteger(contract.timeoutMs) || contract.timeoutMs < 1) throw new Error("timeoutMs must be a positive safe integer");
  const compatibleApi = validateCompatibleApi(contract.compatibleApi, contract.version);
  const capabilities = requireUniqueNonblank(contract.capabilities, "capabilities");
  const metadata = requireUniqueNonblank(contract.metadata, "metadata");
  return Object.freeze({
    ...contract,
    key,
    owner,
    binding,
    methods: Object.freeze([...methods]),
    requestSchema,
    responseSchema,
    errorEnvelope,
    compatibleApi,
    capabilities,
    metadata
  });
}

const SUPPORTED_API_RANGE = Object.freeze({ ...SUPPORTED_RUNTIME_API_RANGE });

export const FIRST_PARTY_API_CONTRACTS: readonly FirstPartyApiContract[] = Object.freeze([
  validateFirstPartyApiContract({
    key: "runtime-snapshot-read",
    version: CURRENT_RUNTIME_API_VERSION,
    owner: "runtime/provider",
    binding: "startup-meta:command-center-runtime-endpoint",
    methods: ["GET"],
    access: "runtime-read",
    requestSchema: "none",
    responseSchema: "cc-runtime-snapshot-v1",
    errorEnvelope: "cc-runtime-disconnected-snapshot-v1",
    compatibleApi: SUPPORTED_API_RANGE,
    pagination: "none",
    correlation: "none",
    timeoutMs: 8000,
    retryPolicy: "none",
    rateLimitApplicability: "provider-managed",
    circuitBreakerApplicability: "not-applicable",
    capabilities: ["runtime-snapshot:read"],
    metadata: ["cache:no-store", "credentials:same-origin"]
  }),
  validateFirstPartyApiContract({
    key: "owner-session",
    version: CURRENT_RUNTIME_API_VERSION,
    owner: "api/owner-session",
    binding: "/api/owner-session",
    methods: ["POST"],
    access: "session-control",
    requestSchema: "owner-session-action-v1",
    responseSchema: "owner-session-public-v1",
    errorEnvelope: "json-error-code-v1",
    compatibleApi: SUPPORTED_API_RANGE,
    pagination: "none",
    correlation: "none",
    timeoutMs: 8000,
    retryPolicy: "none",
    rateLimitApplicability: "provider-managed",
    circuitBreakerApplicability: "not-applicable",
    capabilities: ["owner-session:establish", "owner-session:refresh", "owner-session:clear"],
    metadata: ["same-origin:required", "credentials:cookie-backed"]
  })
]);

export function getFirstPartyApiContract(key: string): FirstPartyApiContract {
  const normalizedKey = requireNonblank(key, "key");
  const contract = FIRST_PARTY_API_CONTRACTS.find((entry) => entry.key === normalizedKey);
  if (!contract) throw new Error(`Unknown first-party API contract: ${normalizedKey}`);
  return contract;
}
