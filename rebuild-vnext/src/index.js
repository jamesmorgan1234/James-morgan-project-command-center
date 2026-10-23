import { AuthorityRegistry } from './governance/authority.js';
import { InvariantRegistry } from './governance/invariants.js';
import { RequirementRegistry } from './governance/requirements.js';
import { ApplicationBootstrap } from './kernel/bootstrap.js';
import { CommandBus } from './kernel/command-bus.js';
import { EventBus } from './kernel/event-bus.js';
import { CapabilityRegistry, ModuleRegistry, RouteRegistry } from './kernel/registries.js';
import { Router } from './kernel/router.js';

let runtimeSingleton = null;

export function createKernelRuntime() {
  const modules = new ModuleRegistry();
  const capabilities = new CapabilityRegistry();
  const routes = new RouteRegistry();
  const events = new EventBus();
  const invariants = new InvariantRegistry();
  const authority = new AuthorityRegistry();
  const requirements = new RequirementRegistry();

  events.define('command.verified', event => {
    if (!event.requestId || !event.commandType) throw new TypeError('verified command event requires requestId and commandType');
  });

  const commands = new CommandBus({ invariants, events });
  const router = new Router(routes);
  const bootstrap = new ApplicationBootstrap(modules);

  return Object.freeze({ authority, invariants, requirements, modules, capabilities, routes, events, commands, router, bootstrap });
}

export function getApplicationRuntime() {
  if (!runtimeSingleton) runtimeSingleton = createKernelRuntime();
  return runtimeSingleton;
}
