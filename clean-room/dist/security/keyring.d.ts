export type EncryptionKeyState = "active" | "retiring" | "revoked";
export interface EncryptionKeyReference {
    readonly id: string;
    readonly version: number;
    readonly state: EncryptionKeyState;
    readonly createdAt: string;
    readonly retiringAt?: string;
    readonly revokedAt?: string;
}
export declare class EncryptionKeyRegistry {
    #private;
    register(key: EncryptionKeyReference): void;
    setState(id: string, state: EncryptionKeyState, at: string): EncryptionKeyReference;
    assertDecryptAllowed(id: string): EncryptionKeyReference;
    get(id: string): EncryptionKeyReference | undefined;
}
