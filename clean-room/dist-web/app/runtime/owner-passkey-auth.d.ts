import { type PasskeyCredentialApi } from "../security/supabase-passkeys.js";
export interface OwnerPasskeyAuthOptions {
    readonly documentRef: Document;
    readonly fetcher?: typeof fetch;
    readonly credentials?: PasskeyCredentialApi;
}
export interface OwnerPasskeyAvailability {
    readonly supported: boolean;
    readonly reason?: "secure_broker_unavailable" | "webauthn_unavailable" | "configuration_missing";
}
export declare function ownerPasskeyAvailability(documentRef: Document, credentials?: PasskeyCredentialApi): OwnerPasskeyAvailability;
export declare function establishOwnerPasskeySession(options: OwnerPasskeyAuthOptions): Promise<void>;
