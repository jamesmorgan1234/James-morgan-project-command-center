/** Read-only projection of canonical bindings. Never promotes registry flags. */
type Row = Readonly<Record<string, unknown>>;
const strings = (value: unknown): readonly string[] => Array.isArray(value) && value.every(v => typeof v === "string") ? value : [];
const records = (value: unknown): readonly Row[] => Array.isArray(value) ? value.filter(v => !!v && typeof v === "object" && !Array.isArray(v)) : [];
export interface SpecialistBindingProjection {
  readonly readiness: Readonly<Record<string, "available" | "unavailable">>;
  readonly blockers: Readonly<Record<string, readonly string[]>>;
}
export function projectSpecialistBindings(input: {
  readonly specialists: readonly Row[];
  readonly profiles: readonly Row[];
  readonly providers: readonly Row[];
  readonly executors: readonly Row[];
  readonly tools: readonly Row[];
  readonly workspaces: readonly Row[];
  readonly verifiedResponseRefs: readonly string[];
  readonly now: string;
}): SpecialistBindingProjection {
  const now = Date.parse(input.now);
  if (!Number.isFinite(now)) throw new Error("A valid readiness clock is required");
  const readiness: Record<string, "available" | "unavailable"> = {};
  const blockers: Record<string, readonly string[]> = {};
  for (const b of input.specialists) {
    if (typeof b.project_id !== "string" || typeof b.brain_key !== "string") continue;
    const project = b.project_id;
    const issues: string[] = [];
    const profiles = input.profiles.filter(p => p.project_id === project);
    const profile = profiles[0];
    if (profiles.length !== 1 || typeof profile?.company_id !== "string" || JSON.stringify(strings(b.supported_project_ids)) !== JSON.stringify([project]) || JSON.stringify(strings(b.supported_company_ids)) !== JSON.stringify([profile.company_id]) || b.control_plane !== "command_center") issues.push("identity_mapping_unverified");
    if (!input.workspaces.some(w => w.project_id === project && typeof w.conversation_id === "string" && Number(w.version) >= 1)) issues.push("project_context_unbound");
    if (b.enabled !== true || b.lifecycle !== "active" || b.health !== "healthy" || b.verification_state !== "verified") issues.push("live_specialist_verification_pending");
    if (!Number.isFinite(Date.parse(String(b.revalidate_after))) || Date.parse(String(b.revalidate_after)) <= now) issues.push("revalidation_required");
    const assignments = records(b.model_assignments);
    if (!assignments.some(m => typeof m.modelId === "string" && typeof m.versionRef === "string" && strings(b.provider_keys).includes(String(m.providerKey)) && input.providers.some(p => p.provider_key === m.providerKey && p.model_id === m.modelId && p.enabled === true && p.cost === "free" && p.health === "available" && p.verification === "live_verified" && strings(p.scopes).includes("company-brain-read-only")))) issues.push("specialist_provider_route_unverified");
    if (!strings(b.permission_keys).includes(`project:${project}:tools.request`)) issues.push("project_tool_request_binding_missing");
    const toolKeys = strings(b.tool_keys);
    if (!toolKeys.length || !toolKeys.every(key => input.tools.some(t => t.tool_key === key && t.availability === "available" && t.free_status === "free" && t.auth_state === "authenticated" && strings((t.action_scope as Row | undefined)?.project_ids).includes(project)))) issues.push("live_project_tool_bindings_unverified");
    const executorProof = `brain:activation-execution:${b.brain_key}@${b.version}`;
    if (!input.executors.some(e => e.enabled === true && e.health === "available" && e.cost_class === "free" && e.retired_at === null && strings(e.capabilities).includes("project.execute") && strings(e.evidence_refs).includes(executorProof))) issues.push("live_job_executor_unverified");
    if (!input.verifiedResponseRefs.includes(`brain:specialist:${b.brain_key}@${b.version}`)) issues.push("version_bound_specialist_response_unverified");
    readiness[project] = issues.length ? "unavailable" : "available";
    blockers[project] = Object.freeze(issues);
  }
  return Object.freeze({readiness: Object.freeze(readiness), blockers: Object.freeze(blockers)});
}
