import assert from "node:assert/strict";
import test from "node:test";

import { AiRouteRegistry } from "../dist/brain/providers.js";
import { AgencyExecutorRegistry } from "../dist/agency/registry.js";
import { FinancialProviderRegistry } from "../dist/finance/providers.js";
import { BookRegistry } from "../dist/books/registry.js";
import { validatePublication, countsAsSale } from "../dist/books/publication.js";
import { reconcileBookMetrics } from "../dist/books/performance.js";
import { SpecialistRegistry } from "../dist/specialists/registry.js";
import { MetricRegistry } from "../dist/analytics/metrics.js";
import { PlatformProfileRegistry } from "../dist/social/profiles.js";
import { AutomationRegistry } from "../dist/personal/automations.js";
import { federatedSearch } from "../dist/personal/search.js";
import { validatePersonalOperations } from "../dist/personal/operations.js";
import { NeedsMeQueue } from "../dist/personal/needs-me.js";
import { ProjectTypeRegistry, ProjectRegistry, advanceFoundry } from "../dist/projects/index.js";
import { ProjectCheckpointStore } from "../dist/projects/checkpoints.js";
import { dryRunMigration } from "../dist/recovery/index.js";
import { AuthSessionStore, PolicyEngine, ProtectedActionGate } from "../dist/security/index.js";
import { createStandardSurfaceReaders } from "../dist/runtime/surface-readers.js";
import { assembleCanonicalRuntimeSnapshot } from "../dist/runtime/assembly.js";

const NOW = "2026-10-23T23:50:00.000Z";

test("P15.14 composes real clean-room contracts in isolated nonproduction state without production providers", () => {
  const brainRoutes = new AiRouteRegistry();
  brainRoutes.register({ key: "ai-route:p15", providerKey: "provider:isolated", modelId: "isolated", versionRef: "v1", enabled: true, capabilities: ["reason"], cost: "free", privacy: "local", health: "available", qualityRank: 1, latencyRank: 1, quotaAvailable: true });

  const agencyExecutors = new AgencyExecutorRegistry();
  agencyExecutors.register({ key: "executor:p15", version: 1, enabled: true, environments: ["deterministic"], capabilities: ["verify"], projectTypeKeys: ["project-type:software"], permissionScopes: ["read:test"], costClass: "free", health: "available", verificationStrategy: "independent", maxRisk: "low" });
  assert.equal(agencyExecutors.eligible({ capability: "verify", projectTypeKey: "project-type:software", environment: "deterministic", risk: "low", allowPaid: false }).length, 1);

  let foundry = { projectId: "p15-isolated", stage: "idea", specVersion: 1, requirementRefs: ["p15.14"], decisionRefs: [], artifactRefs: [] };
  for (const [stage, evidenceRef] of [["research", "e1"], ["ultimate_spec", "e2"], ["architecture", "e3"], ["roadmap", "e4"], ["owner_authorization", "e5"]]) foundry = advanceFoundry(foundry, stage, evidenceRef);
  assert.throws(() => advanceFoundry(foundry, "agency_execution", "e6"));
  foundry = advanceFoundry(foundry, "agency_execution", "e6", "owner-authorized:p15-preview");
  assert.equal(foundry.stage, "agency_execution");

  const searchDocuments = [{ id: "doc:p15", ownerId: "owner:p15", domain: "command-center", projectId: "command-center", title: "P15 acceptance", text: "isolated canonical contract verification", sensitivityRank: 1, provenanceRefs: ["evidence:p15"] }];
  const hits = federatedSearch({ ownerId: "owner:p15", query: "canonical verification", maxSensitivityRank: 1, allowedDomains: ["command-center"], allowedProjectIds: ["command-center"] }, searchDocuments);
  assert.equal(hits.length, 1);
  assert.deepEqual(hits[0].provenanceRefs, ["evidence:p15"]);

  const automations = new AutomationRegistry();
  automations.register({ id: "automation:p15", ownerId: "owner:p15", projectId: "command-center", scheduleRef: "schedule:isolated", enabled: true, actionPolicy: "notification_only", providerHealth: "available", protectedActionsAuthorized: false });
  const executionKey = automations.begin("automation:p15", NOW, NOW);
  automations.finish(executionKey, "completed", ["evidence:isolated-run"]);
  assert.equal(automations.execution(executionKey)?.state, "completed");

  const personalOperations = [{ id: "personal:p15", ownerId: "owner:p15", kind: "obligation", title: "Complete isolated acceptance", truthOwnerKey: "command-center", canonicalRef: "p15.14", status: "planned", sourceRefs: ["roadmap:p15.14"] }];
  assert.doesNotThrow(() => validatePersonalOperations(personalOperations));

  const financeProviders = new FinancialProviderRegistry();
  financeProviders.register({ key: "finance-provider:p15", version: 1, enabled: true, connectionState: "disconnected", consentState: "none", capabilities: ["accounts.read"], dataScopes: [], freshnessSeconds: 60, health: "available" });

  const books = new BookRegistry();
  books.registerBookType("book-type:series");
  books.registerAuthor({ id: "author:p15", displayName: "Acceptance Author", sourceRefs: ["evidence:p15"] });
  books.registerBook({ id: "book:parent", projectId: "books:p15", authorId: "author:p15", canonicalTitle: "Acceptance Series", relationshipKind: "trilogy", parentBookId: null, sequence: null, formats: ["kindle"], bookType: "book-type:series", version: 1 });
  books.registerBook({ id: "book:one", projectId: "books:p15", authorId: "author:p15", canonicalTitle: "Acceptance Book One", relationshipKind: "series", parentBookId: "book:parent", sequence: 1, formats: ["kindle", "paperback"], bookType: "book-type:series", version: 1 });
  assert.deepEqual(books.hierarchy("book:parent").map((book) => book.id), ["book:parent", "book:one"]);
  const publication = validatePublication({ id: "publication:p15", bookId: "book:one", format: "kindle", providerKey: "provider:isolated", state: "uploaded", providerReceiptRef: null, observedAt: NOW, sourceRefs: ["evidence:p15-upload"], testOrder: true });
  assert.equal(countsAsSale(publication), false);
  const metrics = reconcileBookMetrics([{ id: "metric:p15", bookId: "book:one", format: "kindle", metric: "sales", value: 0, currency: null, truth: "confirmed", sourceRef: "evidence:p15-zero", observedAt: NOW }]);
  assert.equal(metrics[0].value, 0);

  const specialists = new SpecialistRegistry();
  const analyticsMetrics = new MetricRegistry();
  analyticsMetrics.register({ key: "metric:p15", domain: "acceptance", owner: "analytics", sourceKind: "canonical", formulaRef: null, freshnessMs: 60000, truth: "verified", format: "count", zeroMeaning: "verified zero", missingMeaning: "unknown" });
  const socialProfiles = new PlatformProfileRegistry();
  socialProfiles.register({ key: "platform:p15", platform: "isolated", version: 1, maxCaptionChars: 100, allowedMediaKinds: ["text"], requiredDisclosureTags: [], sourceRef: "policy:p15" });

  const readers = createStandardSurfaceReaders({ sourceRef: "acceptance:p15", observedAt: NOW, brainRoutes, agencyExecutors, financeProviders, books, specialists, analyticsMetrics, socialProfiles });

  const projectTypes = new ProjectTypeRegistry();
  projectTypes.register({ key: "project-type:software", version: 1, label: "Software", capabilities: ["verify"], requiredDetailSections: ["roadmap"], domainPlaybookKey: "playbook:software" });
  const projects = new ProjectRegistry(projectTypes);
  projects.create({ id: "command-center", typeKey: "project-type:software", ownerId: "owner:p15", name: "Command Center", mission: "Isolated P15.14 acceptance", lifecycle: "active", verification: "verified", priority: "critical", version: 1, createdAt: NOW, updatedAt: NOW, agentAccessEnabled: true, portfolioAutoEnabled: false, protected: true });
  const snapshot = assembleCanonicalRuntimeSnapshot({ providerId: "runtime:p15-isolated", observedAt: NOW, sourceRef: "acceptance:p15", projects, checkpoints: new ProjectCheckpointStore(), needsMe: new NeedsMeQueue(), surfaceReaders: readers, releaseId: "p15-isolated-contract" });
  const surfaces = new Map(snapshot.surfaces.map((surface) => [surface.key, surface]));
  assert.equal(surfaces.get("brain")?.availability, "available");
  assert.equal(surfaces.get("agency")?.availability, "available");
  assert.equal(surfaces.get("finance")?.availability, "disconnected");
  assert.equal(surfaces.get("books")?.availability, "available");
  assert.equal(surfaces.get("specialists")?.availability, "available");
  assert.equal(surfaces.get("analytics")?.availability, "available");
  assert.equal(surfaces.get("social")?.availability, "disconnected");
  assert.equal(surfaces.get("search")?.availability, "unavailable");
  assert.equal(surfaces.get("automations")?.availability, "unavailable");
  assert.equal(surfaces.get("personal")?.availability, "unavailable");

  const sessions = new AuthSessionStore();
  sessions.register({ id: "session:p15", ownerId: "owner:p15", deviceId: "device:isolated", projectId: "command-center", scopes: ["security:protected"], assurance: "passkey_uv", state: "active", createdAt: "2026-10-23T23:40:00.000Z", expiresAt: "2026-10-24T00:40:00.000Z", lastValidatedAt: "2026-10-23T23:49:30.000Z", lastVerifiedAt: "2026-10-23T23:49:30.000Z" });
  const policy = new PolicyEngine();
  policy.register({ action: "project.protected_write", version: 1, enabled: true, riskClass: "high", requiredScopes: ["security:protected"], minimumAssurance: "passkey_uv", freshVerificationMaxAgeMs: 60000, ownerOnly: true, allowProjectWildcard: false });
  const gate = new ProtectedActionGate(sessions, policy);
  assert.equal(gate.authorize({ sessionId: "session:p15", action: "project.protected_write", resourceOwnerId: "owner:p15", resourceProjectId: "command-center", now: NOW }).allowed, true);
  assert.equal(policy.evaluate({ action: "deploy.production", subject: { ownerId: "owner:p15", sessionId: "session:p15", deviceId: "device:isolated", projectId: "command-center", assurance: "fresh_passkey_uv", scopes: ["security:protected"], lastVerifiedAt: "2026-10-23T23:49:30.000Z" }, resourceOwnerId: "owner:p15", resourceProjectId: "command-center", now: NOW }).allowed, false);

  assert.deepEqual(dryRunMigration({ id: "migration:p15", fromVersion: 1, toVersion: 2, preconditionRefs: ["schema:isolated-ok"], backupRef: "backup:isolated", rollbackRef: "rollback:isolated", compatibleFrom: [1] }, 1), { canApply: true, reason: "dry_run_passed" });
});
