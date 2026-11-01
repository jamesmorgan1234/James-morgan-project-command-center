import type { RuntimeSnapshotProvider } from "./provider.js";
export declare class RuntimeSnapshotProviderRegistry {
    #private;
    install(provider: RuntimeSnapshotProvider): void;
    register(provider: RuntimeSnapshotProvider): void;
    remove(id: string): RuntimeSnapshotProvider;
    uninstall(id: string): RuntimeSnapshotProvider;
    get(id: string): RuntimeSnapshotProvider | undefined;
    list(): readonly RuntimeSnapshotProvider[];
    get size(): number;
}
