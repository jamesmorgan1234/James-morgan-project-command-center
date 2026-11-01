export interface ProtocolAdapterContract {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly protocol: "mcp" | "a2a" | "custom";
    readonly capabilities: readonly string[];
    readonly securityRouteKey: string;
}
export declare class ProtocolAdapterRegistry {
    #private;
    register(adapter: ProtocolAdapterContract): void;
    remove(key: string, expectedVersion: number): ProtocolAdapterContract;
    forCapability(capability: string): readonly ProtocolAdapterContract[];
}
