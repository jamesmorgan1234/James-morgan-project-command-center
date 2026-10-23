export interface InterfaceAdapter {
  readonly key: string;
  readonly kind: "phone" | "desktop" | "voice" | "wearable" | "ambient" | "future";
  readonly commandRuntimeKey: string;
  readonly policyRuntimeKey: string;
  readonly canonicalDataRuntimeKey: string;
  readonly removable: boolean;
}

export class InterfaceRegistry {
  readonly #items = new Map<string, InterfaceAdapter>();
  register(adapter: InterfaceAdapter): InterfaceAdapter {
    if (!adapter.key.trim() || !adapter.commandRuntimeKey.trim() || !adapter.policyRuntimeKey.trim() || !adapter.canonicalDataRuntimeKey.trim() || !adapter.removable) throw new Error("interface adapter must reuse canonical runtimes and remain removable");
    if (this.#items.has(adapter.key)) throw new Error("interface already registered");
    const frozen = Object.freeze({ ...adapter });
    this.#items.set(adapter.key, frozen);
    return frozen;
  }
  remove(key: string): InterfaceAdapter {
    const value = this.#items.get(key);
    if (!value) throw new Error("unknown interface");
    this.#items.delete(key);
    return value;
  }
}
