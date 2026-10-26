export type ServiceBusinessDomain = "lead" | "estimate" | "contract" | "job" | "material" | "schedule" | "payment" | "follow_up" | "reputation";

export interface ServiceBusinessBinding {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly crmRef: string;
  readonly calendarRef?: string | undefined;
  readonly paymentProviderRef?: string | undefined;
  readonly sourceRefs: readonly string[];
}

export interface ServiceBusinessState {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly domain: ServiceBusinessDomain;
  readonly canonicalRef: string;
  readonly state: string;
  readonly providerRef?: string | undefined;
  readonly sourceRefs: readonly string[];
}

export interface ServiceBusinessJobLink {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly leadRef?: string | undefined;
  readonly estimateRef?: string | undefined;
  readonly contractRef?: string | undefined;
  readonly jobRef: string;
  readonly scheduleRef?: string | undefined;
  readonly paymentRef?: string | undefined;
  readonly sourceRefs: readonly string[];
}

function refs(values: readonly string[], label: string, required = true): readonly string[] {
  if (!Array.isArray(values) || (required && values.length === 0) || values.some((value) => !value.trim())) throw new Error(`${label} required`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}

export class ServiceBusinessRegistry {
  readonly #bindings = new Map<string, ServiceBusinessBinding>();
  readonly #crmOwners = new Map<string, string>();

  register(input: ServiceBusinessBinding): ServiceBusinessBinding {
    if (!input.id.trim() || !input.ownerId.trim() || !input.projectId.trim() || !input.companyId.trim() || !input.crmRef.trim()) throw new Error("service-business identity/company/crm required");
    if (input.calendarRef !== undefined && !input.calendarRef.trim()) throw new Error("service-business calendar ref cannot be blank");
    if (input.paymentProviderRef !== undefined && !input.paymentProviderRef.trim()) throw new Error("service-business payment provider ref cannot be blank");
    const sourceRefs = refs(input.sourceRefs, "service-business source refs");
    const key = `${input.ownerId}:${input.projectId}`;
    const prior = this.#bindings.get(key);
    if (prior && (prior.companyId !== input.companyId || prior.crmRef !== input.crmRef || prior.calendarRef !== input.calendarRef || prior.paymentProviderRef !== input.paymentProviderRef)) throw new Error("service-business provider binding cannot be silently substituted");
    const crmOwner = this.#crmOwners.get(`${input.ownerId}:${input.crmRef}`);
    if (crmOwner && crmOwner !== input.projectId) throw new Error("service-business CRM is isolated to another project");
    const frozen = Object.freeze({ ...input, sourceRefs });
    this.#bindings.set(key, frozen);
    this.#crmOwners.set(`${input.ownerId}:${input.crmRef}`, input.projectId);
    return frozen;
  }

  require(ownerId: string, projectId: string): ServiceBusinessBinding {
    const binding = this.#bindings.get(`${ownerId}:${projectId}`);
    if (!binding) throw new Error("unknown service-business project");
    return binding;
  }
}

export function validateServiceBusinessState(input: ServiceBusinessState, binding: ServiceBusinessBinding): ServiceBusinessState {
  if (input.ownerId !== binding.ownerId || input.projectId !== binding.projectId || input.companyId !== binding.companyId) throw new Error("service-business state cannot cross company/project boundary");
  if (!input.id.trim() || !input.canonicalRef.trim() || !input.state.trim()) throw new Error("service-business state identity/ref/state required");
  return Object.freeze({ ...input, sourceRefs: refs(input.sourceRefs, "service-business state source refs") });
}

export function validateServiceBusinessJobLink(input: ServiceBusinessJobLink, binding: ServiceBusinessBinding): ServiceBusinessJobLink {
  if (input.ownerId !== binding.ownerId || input.projectId !== binding.projectId || input.companyId !== binding.companyId) throw new Error("service-business job link cannot cross company/project boundary");
  if (!input.id.trim() || !input.jobRef.trim()) throw new Error("service-business job link identity/job required");
  if ([input.leadRef, input.estimateRef, input.contractRef, input.scheduleRef, input.paymentRef].every((value) => value === undefined)) throw new Error("service-business job link requires at least one linked business record");
  for (const value of [input.leadRef, input.estimateRef, input.contractRef, input.scheduleRef, input.paymentRef]) if (value !== undefined && !value.trim()) throw new Error("service-business linked refs cannot be blank");
  return Object.freeze({ ...input, sourceRefs: refs(input.sourceRefs, "service-business job source refs") });
}

export const SERVICE_BUSINESS_TRUTH_OWNER = "specialist:service_business" as const;
