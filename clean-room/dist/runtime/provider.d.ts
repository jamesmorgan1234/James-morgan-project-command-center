import { type CommandCenterRuntimeSnapshot } from "./snapshot.js";
export interface RuntimeSnapshotProvider {
    readonly id: string;
    load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
}
export declare class DisconnectedRuntimeSnapshotProvider implements RuntimeSnapshotProvider {
    readonly id: string;
    constructor(id?: string);
    load(): Promise<CommandCenterRuntimeSnapshot>;
}
export interface HttpRuntimeSnapshotProviderOptions {
    readonly endpoint: string;
    readonly fetcher?: typeof fetch;
    readonly timeoutMs?: number;
}
export declare class HttpRuntimeSnapshotProvider implements RuntimeSnapshotProvider {
    #private;
    readonly id = "runtime:http";
    constructor(options: HttpRuntimeSnapshotProviderOptions);
    load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
}
export declare function providerFromDocument(documentRef: Document): RuntimeSnapshotProvider;
