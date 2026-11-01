import type { BookFormat } from "./registry.js";
import type { PublishingProviderHealth, PublishingAdapterBoundary } from "./providers.js";
export type PublishingConnectionState = "disconnected" | "connected" | "owner_action_required" | "unavailable";
export interface PublishingProviderCapabilities {
    readonly upload: boolean;
    readonly submit: boolean;
    readonly retrievePublicationState: boolean;
    readonly receipts: boolean;
}
export interface PublishingProviderConnection {
    readonly key: string;
    readonly ownerId: string;
    readonly version: number;
    readonly health: PublishingProviderHealth;
    readonly connectionState: PublishingConnectionState;
    readonly credentialRef?: string | undefined;
    readonly formats: readonly BookFormat[];
    readonly capabilities: PublishingProviderCapabilities;
    readonly executionBoundary: PublishingAdapterBoundary;
    readonly ownerActionRequired: boolean;
    readonly evidenceRefs: readonly string[];
    readonly receiptRefs: readonly string[];
    readonly errorRefs: readonly string[];
    readonly replacesProviderKey?: string | undefined;
    readonly migrationRef?: string | undefined;
    readonly observedAt: string;
}
export declare function validatePublishingProviderConnection(value: PublishingProviderConnection): PublishingProviderConnection;
export declare function providerCanUpload(value: PublishingProviderConnection, format: BookFormat): boolean;
