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

  events.define('command.verified', event => {
    if (!event.requestId || !event.commandType) throw new TypeError('verified command event requires requestId and commandType');
  });

  const commands = new CommandBus({ invariants, events });
  const router = new Router(routes);
  const bootstrap = new ApplicationBootstrap(modules);
  const security = new SecurityGate({ sessions, authorizations, protectedActions, audit: securityAudit });

  return Object.freeze({ authority, invariants, requirements, modules, capabilities, routes, events, commands, router, bootstrap, sessions, permissions, authorizations, protectedActions, secrets, securityAudit, security });
}

export function getApplicationRuntime() {
  if (!runtimeSingleton) runtimeSingleton = createKernelRuntime();
  return runtimeSingleton;
}
