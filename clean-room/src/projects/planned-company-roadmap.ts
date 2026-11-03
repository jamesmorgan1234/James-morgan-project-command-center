import { validateRoadmap, type ProjectRoadmap } from "./roadmap.js";

/** Foundry preparation is work, but never the denominator for an entire company. */
export function plannedCompanyPreparation(projectId: string, name: string, sourceRef: string, sourceSha256: string): ProjectRoadmap {
  if (!/^project:company:future:\d{3}$/.test(projectId) || !name.trim()) throw new Error("Canonical planned company identity required");
  if (!/^roadmap\/portfolio-future-architecture\/companies\/\d{3}_[A-Z0-9_]+\.md$/.test(sourceRef) || !/^[a-f0-9]{64}$/.test(sourceSha256)) throw new Error("Exact repository plan and digest required");
  const source = `${sourceRef}#sha256=${sourceSha256}`;
  const first = `${projectId}:compile-spec`;
  const roadmap: ProjectRoadmap = Object.freeze({ projectId, version: 1, workUnits: Object.freeze([
    Object.freeze({ id:first,categoryId:"foundry",phaseId:"ultimate_spec",title:`Compile the implementation specification for ${name}`,status:"planned" as const,applicable:true,dependencyIds:Object.freeze([]),gateIds:Object.freeze([]),acceptanceCriteria:Object.freeze([
      `Read the entire authoritative company plan: ${source}`,
      "Produce a project-scoped, versioned specification covering every product, feature, customer/vertical, Brain, Agent, service, workflow, integration, data, API, monetization, distribution, risk and scale requirement in that plan.",
      "Include security, isolation, privacy, $0 resources, operations/recovery, testing and accessibility. Preserve the current plan's exclusions and owner boundaries; distinguish accepted requirements from unresolved decisions.",
      "Preserve source-to-requirement traceability. Do not claim a build, launch, external action, reused implementation, or complete-company percentage from planning work."
    ]),evidenceRefs:Object.freeze([source]) }),
    Object.freeze({ id:`${projectId}:compile-build-graph`,categoryId:"foundry",phaseId:"roadmap",title:`Create and validate ${name}'s executable build roadmap`,status:"planned" as const,applicable:true,dependencyIds:Object.freeze([first]),gateIds:Object.freeze([]),acceptanceCriteria:Object.freeze([
      "Consume the verified versioned specification; create stable work-unit IDs, dependencies, acceptance criteria, evidence requirements, and a first-incomplete pointer for the complete implementation scope.",
      "Validate missing dependencies, cycles, project isolation, environment requirements and free resource availability. Include independent verification, deployment/recovery and owner-only launch/security/payment gates.",
      "Do not mark implementation complete or enable unattended execution without an actual authorized worker and its fresh claim. Keep the completion denominator untrusted until the full scope is verified."
    ]),evidenceRefs:Object.freeze([source,"clean-room/src/projects/foundry.ts"]) })
  ]), gates:Object.freeze([]) });
  validateRoadmap(roadmap); return roadmap;
}
