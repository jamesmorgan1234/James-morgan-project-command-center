import assert from "node:assert/strict";
import { test } from "node:test";

import { ProjectRegistry, ProjectTypeRegistry } from "../dist/projects/registry.js";
import { ProjectCheckpointStore } from "../dist/projects/checkpoints.js";
import { NeedsMeQueue } from "../dist/personal/needs-me.js";
import { assembleCanonicalRuntimeSnapshot } from "../dist/runtime/assembly.js";

test("canonical runtime assembler consumes clean-room project, roadmap, checkpoint and Needs Me state", () => {
  const types = new ProjectTypeRegistry();
  types.register({ key: "project-type:software", version: 1, label: "Software", capabilities: ["build"], requiredDetailSections: ["roadmap"], domainPlaybookKey: "playbook:software" });
  const projects = new ProjectRegistry(types);
  projects.create({ id: "command-center", typeKey: "project-type:software", ownerId: "james", name: "Command Center", mission: "Operate projects truthfully", lifecycle: "active", verification: "partial", priority: "critical", version: 1, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-23T00:00:00Z", agentAccessEnabled: true, portfolioAutoEnabled: false, protected: true });
  const checkpoints = new ProjectCheckpointStore();
  checkpoints.append({ id: "cp-15", projectId: "command-center", roadmapVersion: 1, createdAt: "2026-10-23T00:00:00Z", exactNextWorkUnitId: "c15-runtime", verificationMethod: "qa", evidenceRefs: ["github:run"], resumeStateHash: "abc" });
  const needsMe = new NeedsMeQueue();
  needsMe.upsert({ id: "need-1", ownerId: "james", needKey: "physical-device", title: "Samsung acceptance", reason: "physical evidence required", urgency: "normal", requiredEnvironment: "phone", ownerAction: "Run final acceptance", unlockRefs: ["release"], resumeRefs: ["c15"], sourceRefs: ["spec"], state: "open" });
  const roadmaps = new Map([["command-center", { roadmap: { projectId: "command-center", version: 1, workUnits: [
    { id: "a", categoryId: "c15", phaseId: "1", title: "A", status: "verified", applicable: true, dependencyIds: [], gateIds: [], acceptanceCriteria: ["pass"] },
    { id: "b", categoryId: "c15", phaseId: "2", title: "B", status: "ready", applicable: true, dependencyIds: [], gateIds: [], acceptanceCriteria: ["pass"] }
  ], gates: [] }, denominatorTrusted: true }]]);
  const snapshot = assembleCanonicalRuntimeSnapshot({ providerId: "runtime:test", observedAt: "2026-10-23T00:00:00Z", sourceRef: "canonical:test", projects, checkpoints, needsMe, roadmaps, ownerDisplayName: "James Morgan", releaseId: "test-release" });
  assert.equal(snapshot.connection.state, "connected");
  assert.equal(snapshot.projects.length, 1);
  assert.deepEqual(snapshot.projects[0].progressPercent, { state: "known", value: 50 });
  assert.deepEqual(snapshot.projects[0].currentCheckpoint, { state: "known", value: "cp-15" });
  assert.match(snapshot.surfaces.find((surface) => surface.key === "needs-me").summary.value, /1 open/);
});
