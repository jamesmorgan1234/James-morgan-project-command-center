import { type IntentClassification } from "../brain/conversation.js";
import { type SupabasePasskeyDescriptor } from "../security/supabase-passkeys.js";
import { type OwnerSessionDescriptor } from "./owner-session-settings.js";
import type { SessionStorageLike } from "./supabase-owner-provider.js";
import type { CommandCenterRuntimeSnapshot, RuntimeBrainImprovementProposal } from "./snapshot.js";
export interface BrainTurnWriteResult {
    readonly turnId: string;
    readonly classification: IntentClassification;
}
export interface BrainConversationRuntimeProvider {
    readonly id: string;
    load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
    createBrainConversation(projectId: string | undefined, title: string): Promise<string>;
    recordBrainOwnerTurn(conversationId: string, text: string): Promise<BrainTurnWriteResult>;
    decideBrainImprovement(improvementId: string, decision: "accepted" | "rejected"): Promise<void>;
    convertBrainImprovementToScopeRequest(improvement: RuntimeBrainImprovementProposal): Promise<string>;
}
export interface OwnerSecurityRuntimeProvider extends BrainConversationRuntimeProvider {
    signIn(email: string, password: string): Promise<void>;
    signOut(): Promise<void>;
    listOwnerPasskeys(): Promise<readonly SupabasePasskeyDescriptor[]>;
    registerOwnerPasskey(): Promise<SupabasePasskeyDescriptor>;
    renameOwnerPasskey(passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor>;
    removeOwnerPasskey(passkeyId: string): Promise<void>;
    listOwnerSessions(): Promise<readonly OwnerSessionDescriptor[]>;
    revokeOwnerSession(sessionId: string): Promise<void>;
    revokeOwnerDevice(deviceId: string): Promise<void>;
}
interface RuntimeProviderLike {
    readonly id: string;
    load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
    signIn(email: string, password: string): Promise<void>;
    signOut(): Promise<void>;
}
export declare function isBrainConversationRuntimeProvider(value: Readonly<{
    id: string;
    load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
}>): value is BrainConversationRuntimeProvider;
export declare function isOwnerSecurityRuntimeProvider(value: RuntimeProviderLike): value is RuntimeProviderLike & OwnerSecurityRuntimeProvider;
export declare class ManagedOwnerRuntimeProvider implements OwnerSecurityRuntimeProvider {
    #private;
    readonly id: string;
    constructor(options: Readonly<{
        inner: RuntimeProviderLike;
        storage: SessionStorageLike;
        supabaseUrl: string;
        publishableKey: string;
        fetcher: typeof fetch;
    }>);
    signIn(email: string, password: string): Promise<void>;
    signOut(): Promise<void>;
    load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
    createBrainConversation(projectId: string | undefined, title: string): Promise<string>;
    recordBrainOwnerTurn(conversationId: string, text: string): Promise<BrainTurnWriteResult>;
    decideBrainImprovement(improvementId: string, decision: "accepted" | "rejected"): Promise<void>;
    convertBrainImprovementToScopeRequest(improvement: RuntimeBrainImprovementProposal): Promise<string>;
    listOwnerPasskeys(): Promise<readonly SupabasePasskeyDescriptor[]>;
    registerOwnerPasskey(): Promise<SupabasePasskeyDescriptor>;
    renameOwnerPasskey(passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor>;
    removeOwnerPasskey(passkeyId: string): Promise<void>;
    listOwnerSessions(): Promise<readonly OwnerSessionDescriptor[]>;
    revokeOwnerSession(sessionId: string): Promise<void>;
    revokeOwnerDevice(deviceId: string): Promise<void>;
}
export {};
