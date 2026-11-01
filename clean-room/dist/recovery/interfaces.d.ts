import { type ProtectedIntent } from '../security/intent.js';
export interface InterfaceAdapter {
    readonly key: string;
    readonly kind: "phone" | "desktop" | "voice" | "wearable" | "ambient" | "future";
    readonly commandRuntimeKey: string;
    readonly policyRuntimeKey: string;
    readonly canonicalDataRuntimeKey: string;
    readonly removable: boolean;
}
export declare class InterfaceRegistry {
    #private;
    register(adapter: InterfaceAdapter): InterfaceAdapter;
    previewIntent(key: string, intent: ProtectedIntent): {
        adapter: InterfaceAdapter;
        intent: ProtectedIntent;
        binding: string;
        executionAuthorized: false;
        sideEffects: false;
    };
    remove(key: string): InterfaceAdapter;
}
