import type { RuntimeSnapshotProvider } from "./provider.js";

function normalizedProviderId(id: string): string {
  const normalized = id.trim();
  if (!normalized) throw new Error("Runtime provider id is required");
  if (normalized !== id) throw new Error("Runtime provider id must not contain surrounding whitespace");
  return normalized;
}

export class RuntimeSnapshotProviderRegistry {
  readonly #providers = new Map<string, RuntimeSnapshotProvider>();

  install(provider: RuntimeSnapshotProvider): void {
    const id = normalizedProviderId(provider.id);
    if (typeof provider.load !== "function") throw new Error(`Runtime provider load() is required: ${id}`);
    if (this.#providers.has(id)) throw new Error(`Runtime provider already installed: ${id}`);
    this.#providers.set(id, provider);
  }

  register(provider: RuntimeSnapshotProvider): void { this.install(provider); }

  remove(id: string): RuntimeSnapshotProvider {
    const key = normalizedProviderId(id);
    const provider = this.#providers.get(key);
    if (!provider) throw new Error(`Unknown runtime provider: ${key}`);
    this.#providers.delete(key);
    return provider;
  }

  uninstall(id: string): RuntimeSnapshotProvider { return this.remove(id); }
  get(id: string): RuntimeSnapshotProvider | undefined { return this.#providers.get(id); }
  list(): readonly RuntimeSnapshotProvider[] { return Object.freeze([...this.#providers.values()]); }
  get size(): number { return this.#providers.size; }
}
