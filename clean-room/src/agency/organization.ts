export interface LeadDefinition {
  readonly key: string;
  readonly capabilities: readonly string[];
  readonly projectTypeKeys: readonly string[];
  readonly authorityScopes: readonly string[];
  readonly maxConcurrentAssignments: number;
  readonly healthy: boolean;
}

export class LeadRegistry {
  readonly #leads = new Map<string, LeadDefinition>();

  register(lead: LeadDefinition): void {
    if (!lead.key.startsWith("lead:")) throw new Error(`Lead key must start with lead:: ${lead.key}`);
    if (!Number.isSafeInteger(lead.maxConcurrentAssignments) || lead.maxConcurrentAssignments < 1) throw new Error("Lead concurrency must be positive");
    if (this.#leads.has(lead.key)) throw new Error(`Lead already exists: ${lead.key}`);
    this.#leads.set(lead.key, Object.freeze({ ...lead, capabilities: Object.freeze([...lead.capabilities]), projectTypeKeys: Object.freeze([...lead.projectTypeKeys]), authorityScopes: Object.freeze([...lead.authorityScopes]) }));
  }

  assemble(input: { capability: string; projectTypeKey: string; requiredAuthorityScopes: readonly string[]; workloadByLead: Readonly<Record<string, number>> }): LeadDefinition {
    const eligible = [...this.#leads.values()].filter((lead) => lead.healthy && lead.capabilities.includes(input.capability) && (lead.projectTypeKeys.length === 0 || lead.projectTypeKeys.includes(input.projectTypeKey)) && input.requiredAuthorityScopes.every((scope) => lead.authorityScopes.includes(scope)) && (input.workloadByLead[lead.key] ?? 0) < lead.maxConcurrentAssignments);
    eligible.sort((a, b) => (input.workloadByLead[a.key] ?? 0) - (input.workloadByLead[b.key] ?? 0) || a.key.localeCompare(b.key));
    const lead = eligible[0];
    if (!lead) throw new Error("No eligible lead for mission");
    return lead;
  }
}
