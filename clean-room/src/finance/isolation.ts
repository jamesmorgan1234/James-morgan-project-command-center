import { assuranceAtLeast, type AssuranceLevel } from "../security/types.js";

export interface FinancialAccessEnvelope {
  readonly ownerId: string;
  readonly subjectOwnerId: string;
  readonly assurance: AssuranceLevel;
  readonly scopes: readonly string[];
  readonly contextDomain: string;
  readonly companyId?: string;
  readonly resourceCompanyId?: string;
  readonly credentialRef?: string;
}

export function assertFinancialReadIsolation(envelope: FinancialAccessEnvelope): void {
  if (envelope.ownerId !== envelope.subjectOwnerId) throw new Error("Finance owner boundary mismatch");
  if (!assuranceAtLeast(envelope.assurance, "passkey_uv")) throw new Error("Finance access requires passkey user verification or stronger");
  if (!envelope.scopes.includes("finance:read")) throw new Error("Finance read scope missing");
  if (envelope.contextDomain !== "finance") throw new Error("Finance data cannot be injected into unrelated context domain by default");
  if ((envelope.companyId ?? null) !== (envelope.resourceCompanyId ?? null)) throw new Error("Finance company/personal isolation boundary mismatch");
  if (envelope.credentialRef !== undefined && !envelope.credentialRef.trim()) throw new Error("Credential reference cannot be blank");
}

export function assertFinancialWriteIsolation(envelope: FinancialAccessEnvelope): void {
  assertFinancialReadIsolation(envelope);
  if (!envelope.scopes.includes("finance:write")) throw new Error("Finance write scope missing");
  if (!assuranceAtLeast(envelope.assurance, "fresh_passkey_uv")) throw new Error("Finance write requires fresh passkey verification");
}
