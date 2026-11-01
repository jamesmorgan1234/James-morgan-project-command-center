import { type CommandCenterRuntimeSnapshot } from "./snapshot.js";
import type { RuntimeSnapshotProvider } from "./provider.js";
export interface SessionStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export type OwnerCredentialSubmit = (email: string, password: string) => Promise<void>;
export type OwnerCredentialPrompt = (submit: OwnerCredentialSubmit) => Promise<void>;
export type OwnerAuthenticatedCallback = (signOut: () => Promise<void>) => void;
export interface SupabaseOwnerRuntimeProviderOptions {
    readonly supabaseUrl: string;
    readonly publishableKey: string;
    readonly releaseId?: string;
    readonly fetcher?: typeof fetch;
    readonly storage?: SessionStorageLike;
    readonly promptForCredentials?: OwnerCredentialPrompt;
    readonly onAuthenticated?: OwnerAuthenticatedCallback;
    readonly requestTimeoutMs?: number;
}
export declare class SupabaseOwnerRuntimeSnapshotProvider implements RuntimeSnapshotProvider {
    #private;
    readonly id = "runtime:supabase-owner";
    constructor(options: SupabaseOwnerRuntimeProviderOptions);
    signIn(email: string, password: string): Promise<void>;
    signOut(): Promise<void>;
    load(): Promise<CommandCenterRuntimeSnapshot>;
}
