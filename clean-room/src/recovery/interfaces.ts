import {createIntentBinding,type ProtectedIntent} from '../security/intent.js';
import {recoveryImmutable,requireRecovery} from './contracts.js';
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
    requireRecovery(["phone","desktop","voice","wearable","ambient","future"].includes(adapter.kind),"interface_kind_invalid");
    requireRecovery(adapter.commandRuntimeKey==="command-runtime"&&adapter.policyRuntimeKey==="policy-runtime"&&adapter.canonicalDataRuntimeKey==="canonical-data","interface_parallel_runtime_forbidden");
    if (this.#items.has(adapter.key)) throw new Error("interface already registered");
    const frozen = Object.freeze({ ...adapter });
    this.#items.set(adapter.key, frozen);
    return frozen;
  }
  previewIntent(key:string,intent:ProtectedIntent){const adapter=this.#items.get(key);requireRecovery(adapter,"interface_not_registered");const binding=createIntentBinding(intent);return recoveryImmutable({adapter,intent,binding,executionAuthorized:false as const,sideEffects:false as const});}
  remove(key: string): InterfaceAdapter {
    const value = this.#items.get(key);
    if (!value) throw new Error("unknown interface");
    this.#items.delete(key);
    return value;
  }
}
