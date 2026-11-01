import { createIntentBinding } from '../security/intent.js';
import { recoveryImmutable, requireRecovery } from './contracts.js';
export class InterfaceRegistry {
    #items = new Map();
    register(adapter) {
        if (!adapter.key.trim() || !adapter.commandRuntimeKey.trim() || !adapter.policyRuntimeKey.trim() || !adapter.canonicalDataRuntimeKey.trim() || !adapter.removable)
            throw new Error("interface adapter must reuse canonical runtimes and remain removable");
        requireRecovery(["phone", "desktop", "voice", "wearable", "ambient", "future"].includes(adapter.kind), "interface_kind_invalid");
        requireRecovery(adapter.commandRuntimeKey === "command-runtime" && adapter.policyRuntimeKey === "policy-runtime" && adapter.canonicalDataRuntimeKey === "canonical-data", "interface_parallel_runtime_forbidden");
        if (this.#items.has(adapter.key))
            throw new Error("interface already registered");
        const frozen = Object.freeze({ ...adapter });
        this.#items.set(adapter.key, frozen);
        return frozen;
    }
    previewIntent(key, intent) { const adapter = this.#items.get(key); requireRecovery(adapter, "interface_not_registered"); const binding = createIntentBinding(intent); return recoveryImmutable({ adapter, intent, binding, executionAuthorized: false, sideEffects: false }); }
    remove(key) {
        const value = this.#items.get(key);
        if (!value)
            throw new Error("unknown interface");
        this.#items.delete(key);
        return value;
    }
}
//# sourceMappingURL=interfaces.js.map