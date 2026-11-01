export interface PasskeyCredential {
    readonly id: string;
    readonly ownerId: string;
    readonly deviceId?: string;
    readonly publicKeyRef: string;
    readonly authenticatorAttachment: "platform";
    readonly userVerification: "required";
    readonly transports: readonly string[];
    readonly createdAt: string;
    readonly lastUsedAt?: string;
    readonly revokedAt?: string;
}
export declare class PasskeyRegistry {
    #private;
    register(input: PasskeyCredential): void;
    get(id: string): PasskeyCredential | undefined;
    listByOwner(ownerId: string): readonly PasskeyCredential[];
    assertUsable(id: string, ownerId: string): PasskeyCredential;
    recordAssertion(id: string, ownerId: string, userVerified: boolean, assertedAt: string): PasskeyCredential;
    revoke(id: string, revokedAt: string): PasskeyCredential;
}
