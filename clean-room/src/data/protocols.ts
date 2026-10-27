export interface ProtocolAdapterContract {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly protocol: "mcp" | "a2a" | "custom";
  readonly capabilities: readonly string[];
  readonly securityRouteKey: string;
}

export class ProtocolAdapterRegistry {
  readonly #adapters = new Map<string, ProtocolAdapterContract>();

  register(adapter: ProtocolAdapterContract): void {
    if (!["mcp", "a2a", "custom"].includes(adapter.protocol) || typeof adapter.enabled !== "boolean") throw new Error("Unsupported protocol contract state");
    if (!adapter.key.slice("protocol:".length).trim() || adapter.capabilities.some((item) => !item.trim()) || new Set(adapter.capabilities).size !== adapter.capabilities.length) throw new Error("Protocol identity and capabilities must be unique and nonblank");
    if (!adapter.key.startsWith("protocol:")) throw new Error(`Protocol adapter key must start with protocol:: ${adapter.key}`);
    if (!Number.isSafeInteger(adapter.version) || adapter.version < 1) throw new Error("Protocol adapter version must be positive");
    if (!adapter.securityRouteKey.trim()) throw new Error("Protocol adapter requires a security route");
    if (this.#adapters.has(adapter.key)) throw new Error(`Protocol adapter already exists: ${adapter.key}`);
    this.#adapters.set(adapter.key, Object.freeze({ ...adapter, capabilities: Object.freeze([...adapter.capabilities]) }));
  }

  remove(key: string, expectedVersion: number): ProtocolAdapterContract {
    const current = this.#adapters.get(key);
    if (!current) throw new Error(`Unknown protocol adapter: ${key}`);
    if (current.version !== expectedVersion) throw new Error(`Protocol adapter version conflict for ${key}`);
    this.#adapters.delete(key);
    return current;
  }

  forCapability(capability: string): readonly ProtocolAdapterContract[] {
    return Object.freeze([...this.#adapters.values()].filter((adapter) => adapter.enabled && adapter.capabilities.includes(capability)));
  }
}
