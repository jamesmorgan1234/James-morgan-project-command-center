import { AuthorityRegistry } from './governance/authority.js';
import { InvariantRegistry } from './governance/invariants.js';
import { RequirementRegistry } from './governance/requirements.js';
import { ApplicationBootstrap } from './kernel/bootstrap.js';
import { CommandBus } from './kernel/command-bus.js';
import { EventBus } from './kernel/event-bus.js';
import { CapabilityRegistry, ModuleRegistry, RouteRegistry } from './kernel/registries.js';
import { Router } from './kernel/router.js';
import { SessionRegistry } from './identity/sessions.js';
import { PermissionRegistry, AuthorizationService } from './security/permissions.js';
import { ProtectedActionRegistry } from './security/protected-actions.js';
import { SecretReferenceRegistry } from './security/secrets.js';
import { SecurityAuditLog } from './security/audit-log.js';
import { SecurityGate } from './security/gate.js';
import { RecordStore } from './data/record-store.js';
import { AssetRegistry } from './data/assets.js';
import { CommandGraph } from './graph/command-graph.js';
import { ProviderRegistry } from './providers/provider-registry.js';
import { ClientShellState } from './client/shell.js';
import { ProjectRegistry } from './projects/project-registry.js';
import { RoadmapRegistry } from './projects/roadmap.js';
import { CheckpointRegistry } from './projects/checkpoints.js';
import { ProjectLineage } from './projects/lineage.js';
import { BrainProviderRegistry } from './brain/provider-registry.js';
import { BrainService } from './brain/brain.js';
import { AgentRuntime } from './agent/agent.js';
import { PersonalOperations } from './personal/operations.js';
import { SearchIndex } from './search/search-index.js';
import { NotificationCenter } from './notifications/notification-center.js';
import { AutomationRegistry } from './automation/automation-registry.js';
import { FinanceRegistry } from './finance/finance.js';
import { SocialRegistry } from './social/social.js';
import { BookRegistry } from './books/books.js';
import { SpecialistRegistry } from './specialists/specialist-registry.js';
import { ProtocolRegistry } from './interop/protocol-registry.js';
import { ObservabilityLedger } from './analytics/observability.js';
import { RecoveryRegistry } from './recovery/recovery.js';
import { ReleaseManager } from './release/release-manager.js';

let runtimeSingleton = null;

export function createKernelRuntime() {
  const modules = new ModuleRegistry();
  const capabilities = new CapabilityRegistry();
  const routes = new RouteRegistry();
  const events = new EventBus();
  const invariants = new InvariantRegistry();
  const authority = new AuthorityRegistry();
  const requirements = new RequirementRegistry();
  const sessions = new SessionRegistry();
  const permissions = new PermissionRegistry();
  const authorizations = new AuthorizationService(permissions);
  const protectedActions = new ProtectedActionRegistry();
  const secrets = new SecretReferenceRegistry();
  const securityAudit = new SecurityAuditLog();
  const records = new RecordStore();
  const assets = new AssetRegistry();
  const graph = new CommandGraph();
  const providers = new ProviderRegistry();
  const clientShell = new ClientShellState();
  const projects = new ProjectRegistry();
  const roadmaps = new RoadmapRegistry();
  const checkpoints = new CheckpointRegistry();
  const projectLineage = new ProjectLineage();
  const brainProviders = new BrainProviderRegistry();
  const brain = new BrainService(brainProviders);
  const agent = new AgentRuntime();
  const personal = new PersonalOperations();
  const search = new SearchIndex();
  const notifications = new NotificationCenter();
  const automations = new AutomationRegistry();
  const finance = new FinanceRegistry();
  const social = new SocialRegistry();
  const books = new BookRegistry();
  const specialists = new SpecialistRegistry();
  const protocols = new ProtocolRegistry();
  const observability = new ObservabilityLedger();
  const recovery = new RecoveryRegistry();
  const releases = new ReleaseManager();

  events.define('command.verified', event => {
    if (!event.requestId || !event.commandType) throw new TypeError('verified command event requires requestId and commandType');
  });

  const commands = new CommandBus({ invariants, events });
  const router = new Router(routes);
  const bootstrap = new ApplicationBootstrap(modules);
  const security = new SecurityGate({ sessions, authorizations, protectedActions, audit: securityAudit });

  return Object.freeze({ authority, invariants, requirements, modules, capabilities, routes, events, commands, router, bootstrap, sessions, permissions, authorizations, protectedActions, secrets, securityAudit, security, records, assets, graph, providers, clientShell, projects, roadmaps, checkpoints, projectLineage, brainProviders, brain, agent, personal, search, notifications, automations, finance, social, books, specialists, protocols, observability, recovery, releases });
}

export function getApplicationRuntime() {
  if (!runtimeSingleton) runtimeSingleton = createKernelRuntime();
  return runtimeSingleton;
}
