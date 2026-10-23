import { BootstrapError } from './errors.js';
import { StateMachine, APPLICATION_LIFECYCLE } from './state-machine.js';

export class ApplicationBootstrap {
  #modules;
  #lifecycle = new StateMachine(APPLICATION_LIFECYCLE);
  #results = new Map();
  #started = false;

  constructor(moduleRegistry) { this.#modules = moduleRegistry; }
  get lifecycle() { return this.#lifecycle; }
  get results() { return new Map(this.#results); }

  async start(initializers = {}) {
    if (this.#started) throw new BootstrapError('Application bootstrap may only start once');
    this.#started = true;
    this.#modules.validateDependencyGraph();
    this.#lifecycle.transition('bootstrapping', { reason: 'owner/application start' });

    const ordered = topologicalModules(this.#modules.list());
    let degraded = false;
    for (const module of ordered) {
      const init = initializers[module.id];
      if (!init) {
        if (module.activationState === 'CORE — ACTIVE') {
          this.#lifecycle.transition('recovery_required', { reason: `missing initializer for core module ${module.id}` });
          throw new BootstrapError(`Missing initializer for core module ${module.id}`, { moduleId: module.id });
        }
        this.#results.set(module.id, { status: 'disabled', reason: 'no initializer' });
        continue;
      }
      try {
        const value = await init();
        this.#results.set(module.id, { status: 'ready', value });
      } catch (error) {
        this.#results.set(module.id, { status: 'failed', error });
        if (module.activationState === 'CORE — ACTIVE') {
          this.#lifecycle.transition('recovery_required', { reason: `core module ${module.id} failed` });
          throw new BootstrapError(`Core module ${module.id} failed`, { moduleId: module.id }, error);
        }
        degraded = true;
      }
    }
    this.#lifecycle.transition(degraded ? 'degraded' : 'ready', { reason: degraded ? 'optional module failure contained' : 'all active modules ready' });
    return Object.freeze({ state: this.#lifecycle.state, modules: [...this.#results.entries()] });
  }
}

function topologicalModules(modules) {
  const byId = new Map(modules.map(m => [m.id, m]));
  const visited = new Set();
  const ordered = [];
  const visit = id => {
    if (visited.has(id)) return;
    for (const dep of byId.get(id).dependencies) visit(dep);
    visited.add(id);
    ordered.push(byId.get(id));
  };
  for (const module of modules) visit(module.id);
  return ordered;
}
