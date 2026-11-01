export type PasskeyMediation = "silent" | "optional" | "required" | "conditional";
export interface PasskeyCredentialApi {
    create(options: CredentialCreationOptions): Promise<Credential | null>;
    get(options?: CredentialRequestOptions): Promise<Credential | null>;
}
export interface SupabasePasskeyClientOptions {
    readonly authBaseUrl: string;
    readonly publishableKey: string;
    readonly fetcher?: typeof fetch;
    readonly credentials?: PasskeyCredentialApi;
}
export interface SupabasePasskeyDescriptor {
    readonly id: string;
    readonly friendlyName?: string;
    readonly createdAt: string;
    readonly lastUsedAt?: string;
}
export interface SupabasePasskeySession {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresIn?: number;
    readonly expiresAt?: number;
    readonly tokenType?: string;
    readonly user: Readonly<Record<string, unknown>>;
}
export interface SupabasePasskeySignInResult {
    readonly session: SupabasePasskeySession;
    readonly user: Readonly<Record<string, unknown>>;
}
export declare class SupabasePasskeyError extends Error {
    readonly code: string;
    readonly status?: number;
    constructor(message: string, code?: string, status?: number);
}
export declare class SupabasePasskeyClient {
    #private;
    constructor(options: SupabasePasskeyClientOptions);
    register(accessToken: string): Promise<SupabasePasskeyDescriptor>;
    signIn(options?: Readonly<{
        mediation?: PasskeyMediation;
        captchaToken?: string;
    }>): Promise<SupabasePasskeySignInResult>;
    list(accessToken: string): Promise<readonly SupabasePasskeyDescriptor[]>;
    rename(accessToken: string, passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor>;
    remove(accessToken: string, passkeyId: string): Promise<void>;
    cancelCeremony(): void;
}
