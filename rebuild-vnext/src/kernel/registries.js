import { RegistrationError } from './errors.js';

export class TypedRegistry {
  #name;
  #items = new Map();
  #validate;

  constructor(name, validate = () => true) {
    this.#name = name;
    this.#validate = validate;
  }

  register(id, value) {
    if (!id || typeof id !== 'string') throw new RegistrationError(`${this.#name}: string id required`);
    if (this.#items.has(id)) throw new RegistrationError(`${this.#name}: duplicate id ${id}`, { id });
    this.#validate(value, id);
    this.#items.set(id, Object.freeze(structuredClone(value)));
    return this.get(id);
  }

  get(id) { return this.#items.get(id) ?? null; }
  has(id) { return this.#items.has(id); }
  list() { return Object.freeze([...this.#items.entries()].map(([id, value]) => ({ id, ...structuredClone(value) }))); }
}

export class ModuleRegistry extends TypedRegistry {
  constructor() {
    super('ModuleRegistry', (manifest, id) => {
      for (const key of ['version', 'owner', 'activationState', 'dependencies', 'failureBehavior', 'disableBehavior', 'removalBehavior']) {
        if (!(key in manifest)) throw new RegistrationError(`Module ${id} missing ${key}`);
      }
      if (!Array.isArray(manifest.dependencies)) throw new RegistrationError(`Module ${id} dependencies must be an array`);
    });
  }

  validateDependencyGraph() {
    const manifests = new Map(this.list().map(({ id, ...m }) => [id, m]));
    for (const [id, manifest] of manifests) {
      for (const dependency of manifest.dependencies) {
        if (!manifests.has(dependency)) {
          throw new RegistrationError(`Module ${id} depends on unknown module ${dependency}`, { id, dependency });
        }
      }
    }
    const visiting = new Set();
    const visited = new Set();
    const walk = id => {
      if (visiting.has(id)) throw new RegistrationError(`Circular module dependency detected at ${id}`, { id });
      if (visited.has(id)) return;
      visiting.add(id);
      for (const dep of manifests.get(id).dependencies) walk(dep);
      visiting.delete(id);
      visited.add(id);
    };
    for (const id of manifests.keys()) walk(id);
    return true;
  }
}

export class CapabilityRegistry extends TypedRegistry {
  #ownerByCapability = new Map();
  constructor() {
    super('CapabilityRegistry', (capability, id) => {
      for (const key of ['owner', 'inputs', 'outputs', 'permissions', 'riskLevel', 'activationState', 'verification']) {
        if (!(key in capability)) throw new RegistrationError(`Capability ${id} missing ${key}`);
      }
    });
  }

  register(id, value) {
    const existingOwner = this.#ownerByCapability.get(id);
    if (existingOwner && existingOwner !== value.owner) {
      throw new RegistrationError(`Capability ${id} already has canonical owner ${existingOwner}`, { id, existingOwner, attemptedOwner: value.owner });
    }
    const result = super.register(id, value);
    this.#ownerByCapability.set(id, value.owner);
    return result;
  }
}

export class RouteRegistry extends TypedRegistry {
  constructor() {
    super('RouteRegistry', (route, id) => {
      if (!route.path || !route.owner) throw new RegistrationError(`Route ${id} requires path and owner`);
    });
  }
}
